const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const schedulerAlgorithm = require('../services/scheduler/algorithm');

/**
 * Generate a new schedule using the algorithm
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateSchedule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, constraints } = req.body;

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (start > end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Load doctor data
    const doctorsData = await loadDoctorData();
    if (!doctorsData || !doctorsData.data || doctorsData.data.length === 0) {
      return res.status(404).json({ message: 'No doctor data found' });
    }

    // Load performance data
    const performanceData = await loadPerformanceData();
    if (!performanceData || !performanceData.data) {
      return res.status(404).json({ message: 'No performance data found' });
    }

    // Generate shifts for the date range
    const shifts = generateShiftsForDateRange(start, end);

    // Set default constraints if not provided
    const defaultConstraints = {
      maxConsecutiveShifts: 3,
      maxShiftsPerWeek: 5,
      maxNightShiftsPerWeek: 3,
      minRestHours: 12
    };

    const schedulingConstraints = { ...defaultConstraints, ...constraints };

    // Generate schedule
    const scheduleResult = await schedulerAlgorithm.generateSchedule({
      doctors: doctorsData.data,
      shifts,
      performance: performanceData.data,
      constraints: schedulingConstraints
    });

    // Validate the generated schedule
    const validationResult = schedulerAlgorithm.validateSchedule(
      scheduleResult.schedule,
      doctorsData.data,
      schedulingConstraints
    );

    // Save the generated schedule
    const scheduleId = `schedule_${Date.now()}`;
    const schedulePath = path.join(__dirname, '../../data/processed', `${scheduleId}.json`);
    
    fs.writeFileSync(schedulePath, JSON.stringify({
      id: scheduleId,
      startDate,
      endDate,
      constraints: schedulingConstraints,
      schedule: scheduleResult.schedule,
      statistics: scheduleResult.statistics,
      validation: validationResult,
      status: 'draft',
      createdAt: new Date().toISOString()
    }, null, 2));

    return res.status(200).json({
      message: 'Schedule generated successfully',
      scheduleId,
      statistics: scheduleResult.statistics,
      validation: validationResult,
      unfilled: scheduleResult.unfilled.length
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    return res.status(500).json({ message: 'Error generating schedule', error: error.message });
  }
};

/**
 * Retrieve schedule data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    // If no schedule ID provided, return list of schedules
    if (!scheduleId) {
      const schedules = await listSchedules();
      return res.status(200).json({ schedules });
    }
    
    // Load specific schedule
    const schedulePath = path.join(__dirname, '../../data/processed', `${scheduleId}.json`);
    
    if (!fs.existsSync(schedulePath)) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    const scheduleData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    
    // If doctor ID is provided, filter assignments for that doctor
    if (req.query.doctorId) {
      const doctorId = req.query.doctorId;
      const doctorAssignments = scheduleData.schedule.doctorAssignments[doctorId] || [];
      
      return res.status(200).json({
        scheduleId,
        startDate: scheduleData.startDate,
        endDate: scheduleData.endDate,
        status: scheduleData.status,
        assignments: doctorAssignments,
        statistics: scheduleData.statistics.doctorStats[doctorId]
      });
    }
    
    return res.status(200).json(scheduleData);
  } catch (error) {
    console.error('Error retrieving schedule:', error);
    return res.status(500).json({ message: 'Error retrieving schedule', error: error.message });
  }
};

/**
 * Update schedule entries
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSchedule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { scheduleId } = req.params;
    const { assignments } = req.body;
    
    // Load schedule
    const schedulePath = path.join(__dirname, '../../data/processed', `${scheduleId}.json`);
    
    if (!fs.existsSync(schedulePath)) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    const scheduleData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    
    // Check if schedule is in draft or approved status
    if (scheduleData.status === 'published') {
      return res.status(400).json({ message: 'Cannot update a published schedule' });
    }
    
    // Update assignments
    for (const assignment of assignments) {
      const { shiftId, doctorId } = assignment;
      
      // Find the shift in the schedule
      const shiftIndex = scheduleData.schedule.assignments.findIndex(a => a.shiftId === shiftId);
      
      if (shiftIndex === -1) {
        return res.status(404).json({ message: `Shift with ID ${shiftId} not found` });
      }
      
      // Get the old assignment
      const oldAssignment = scheduleData.schedule.assignments[shiftIndex];
      const oldDoctorId = oldAssignment.doctorId;
      
      // Remove from old doctor's assignments
      if (scheduleData.schedule.doctorAssignments[oldDoctorId]) {
        scheduleData.schedule.doctorAssignments[oldDoctorId] = 
          scheduleData.schedule.doctorAssignments[oldDoctorId].filter(a => a.shiftId !== shiftId);
        
        // Update shift counts
        scheduleData.schedule.shiftCounts[oldDoctorId].total--;
        scheduleData.schedule.shiftCounts[oldDoctorId][oldAssignment.type]--;
        
        const shiftDate = new Date(oldAssignment.date);
        if ([0, 6].includes(shiftDate.getDay())) { // Sunday or Saturday
          scheduleData.schedule.shiftCounts[oldDoctorId].weekend--;
        }
      }
      
      // Load doctor data to get name
      const doctorsData = await loadDoctorData();
      const doctor = doctorsData.data.find(d => d.id === doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: `Doctor with ID ${doctorId} not found` });
      }
      
      // Update the assignment
      scheduleData.schedule.assignments[shiftIndex] = {
        ...oldAssignment,
        doctorId,
        doctorName: doctor.name
      };
      
      // Add to new doctor's assignments
      if (!scheduleData.schedule.doctorAssignments[doctorId]) {
        scheduleData.schedule.doctorAssignments[doctorId] = [];
      }
      
      scheduleData.schedule.doctorAssignments[doctorId].push(scheduleData.schedule.assignments[shiftIndex]);
      
      // Update shift counts
      if (!scheduleData.schedule.shiftCounts[doctorId]) {
        scheduleData.schedule.shiftCounts[doctorId] = {
          total: 0,
          day: 0,
          night: 0,
          weekend: 0
        };
      }
      
      scheduleData.schedule.shiftCounts[doctorId].total++;
      scheduleData.schedule.shiftCounts[doctorId][oldAssignment.type]++;
      
      const shiftDate = new Date(oldAssignment.date);
      if ([0, 6].includes(shiftDate.getDay())) { // Sunday or Saturday
        scheduleData.schedule.shiftCounts[doctorId].weekend++;
      }
    }
    
    // Recalculate statistics
    const doctorsData = await loadDoctorData();
    scheduleData.statistics = calculateScheduleStatistics(scheduleData.schedule, doctorsData.data);
    
    // Validate the updated schedule
    scheduleData.validation = schedulerAlgorithm.validateSchedule(
      scheduleData.schedule,
      doctorsData.data,
      scheduleData.constraints
    );
    
    // Update modified timestamp
    scheduleData.modifiedAt = new Date().toISOString();
    
    // Save updated schedule
    fs.writeFileSync(schedulePath, JSON.stringify(scheduleData, null, 2));
    
    return res.status(200).json({
      message: 'Schedule updated successfully',
      statistics: scheduleData.statistics,
      validation: scheduleData.validation
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return res.status(500).json({ message: 'Error updating schedule', error: error.message });
  }
};

/**
 * Approve a generated schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const approveSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    // Load schedule
    const schedulePath = path.join(__dirname, '../../data/processed', `${scheduleId}.json`);
    
    if (!fs.existsSync(schedulePath)) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    const scheduleData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    
    // Check if schedule is in draft status
    if (scheduleData.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft schedules can be approved' });
    }
    
    // Update status
    scheduleData.status = 'approved';
    scheduleData.approvedAt = new Date().toISOString();
    scheduleData.approvedBy = req.user.id; // Assuming user info is in req.user from auth middleware
    
    // Save updated schedule
    fs.writeFileSync(schedulePath, JSON.stringify(scheduleData, null, 2));
    
    return res.status(200).json({
      message: 'Schedule approved successfully',
      scheduleId,
      status: 'approved'
    });
  } catch (error) {
    console.error('Error approving schedule:', error);
    return res.status(500).json({ message: 'Error approving schedule', error: error.message });
  }
};

/**
 * Publish an approved schedule to doctors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const publishSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    // Load schedule
    const schedulePath = path.join(__dirname, '../../data/processed', `${scheduleId}.json`);
    
    if (!fs.existsSync(schedulePath)) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    const scheduleData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    
    // Check if schedule is in approved status
    if (scheduleData.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved schedules can be published' });
    }
    
    // Update status
    scheduleData.status = 'published';
    scheduleData.publishedAt = new Date().toISOString();
    scheduleData.publishedBy = req.user.id; // Assuming user info is in req.user from auth middleware
    
    // Save updated schedule
    fs.writeFileSync(schedulePath, JSON.stringify(scheduleData, null, 2));
    
    // In a real application, we would notify doctors here
    // For example, sending emails or push notifications
    
    return res.status(200).json({
      message: 'Schedule published successfully',
      scheduleId,
      status: 'published'
    });
  } catch (error) {
    console.error('Error publishing schedule:', error);
    return res.status(500).json({ message: 'Error publishing schedule', error: error.message });
  }
};

/**
 * Export schedule in various formats (PDF, CSV)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { format } = req.query;
    
    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ message: 'Invalid export format. Supported formats: pdf, csv' });
    }
    
    // Load schedule
    const schedulePath = path.join(__dirname, '../../data/processed', `${scheduleId}.json`);
    
    if (!fs.existsSync(schedulePath)) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    const scheduleData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    
    // Create export directory if it doesn't exist
    const exportDir = path.join(__dirname, '../../data/exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    if (format === 'pdf') {
      // Generate PDF
      const pdfPath = path.join(exportDir, `schedule_${scheduleId}.pdf`);
      await generateSchedulePDF(scheduleData, pdfPath);
      
      // Send file to client
      res.download(pdfPath, `schedule_${scheduleId}.pdf`, (err) => {
        if (err) {
          console.error('Error sending PDF file:', err);
        }
        
        // Clean up file after sending
        fs.unlinkSync(pdfPath);
      });
    } else if (format === 'csv') {
      // Generate CSV
      const csvPath = path.join(exportDir, `schedule_${scheduleId}.csv`);
      await generateScheduleCSV(scheduleData, csvPath);
      
      // Send file to client
      res.download(csvPath, `schedule_${scheduleId}.csv`, (err) => {
        if (err) {
          console.error('Error sending CSV file:', err);
        }
        
        // Clean up file after sending
        fs.unlinkSync(csvPath);
      });
    }
  } catch (error) {
    console.error('Error exporting schedule:', error);
    return res.status(500).json({ message: 'Error exporting schedule', error: error.message });
  }
};

/**
 * Generate PDF file for schedule
 * @param {Object} scheduleData - Schedule data
 * @param {string} outputPath - Path to save PDF
 */
const generateSchedulePDF = async (scheduleData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      
      doc.pipe(stream);
      
      // Title
      doc.fontSize(20).text('ICU Shift Schedule', { align: 'center' });
      doc.moveDown();
      
      // Schedule info
      doc.fontSize(12).text(`Schedule ID: ${scheduleData.id}`);
      doc.text(`Period: ${new Date(scheduleData.startDate).toLocaleDateString()} to ${new Date(scheduleData.endDate).toLocaleDateString()}`);
      doc.text(`Status: ${scheduleData.status}`);
      doc.moveDown();
      
      // Statistics
      doc.fontSize(16).text('Schedule Statistics');
      doc.fontSize(12).text(`Total Shifts: ${scheduleData.statistics.totalShifts}`);
      doc.text(`Unfilled Shifts: ${scheduleData.statistics.unfilledShifts}`);
      doc.text(`Coverage Rate: ${(scheduleData.statistics.coverageRate * 100).toFixed(2)}%`);
      doc.moveDown();
      
      // Shift Type Distribution
      doc.text(`Day Shifts: ${scheduleData.statistics.shiftTypeDistribution.day}`);
      doc.text(`Night Shifts: ${scheduleData.statistics.shiftTypeDistribution.night}`);
      doc.text(`Weekend Shifts: ${scheduleData.statistics.shiftTypeDistribution.weekend}`);
      doc.moveDown();
      
      // Assignments table
      doc.fontSize(16).text('Shift Assignments');
      doc.moveDown();
      
      // Sort assignments by date
      const sortedAssignments = [...scheduleData.schedule.assignments].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      
      // Table headers
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidth = 100;
      
      doc.fontSize(10);
      doc.text('Date', tableLeft, tableTop);
      doc.text('Shift Type', tableLeft + colWidth, tableTop);
      doc.text('Doctor', tableLeft + colWidth * 2, tableTop);
      
      doc.moveTo(tableLeft, tableTop - 5)
        .lineTo(tableLeft + colWidth * 3, tableTop - 5)
        .stroke();
      
      doc.moveTo(tableLeft, tableTop + 15)
        .lineTo(tableLeft + colWidth * 3, tableTop + 15)
        .stroke();
      
      // Table rows
      let rowTop = tableTop + 20;
      
      for (const assignment of sortedAssignments) {
        // Add a new page if we're near the bottom
        if (rowTop > doc.page.height - 50) {
          doc.addPage();
          rowTop = 50;
          
          // Repeat headers on new page
          doc.text('Date', tableLeft, rowTop);
          doc.text('Shift Type', tableLeft + colWidth, rowTop);
          doc.text('Doctor', tableLeft + colWidth * 2, rowTop);
          
          doc.moveTo(tableLeft, rowTop - 5)
            .lineTo(tableLeft + colWidth * 3, rowTop - 5)
            .stroke();
          
          doc.moveTo(tableLeft, rowTop + 15)
            .lineTo(tableLeft + colWidth * 3, rowTop + 15)
            .stroke();
          
          rowTop += 20;
        }
        
        const date = new Date(assignment.date).toLocaleDateString();
        doc.text(date, tableLeft, rowTop);
        doc.text(assignment.type, tableLeft + colWidth, rowTop);
        doc.text(assignment.doctorName, tableLeft + colWidth * 2, rowTop);
        
        rowTop += 20;
      }
      
      // Unfilled shifts
      if (scheduleData.schedule.unfilled && scheduleData.schedule.unfilled.length > 0) {
        doc.addPage();
        doc.fontSize(16).text('Unfilled Shifts');
        doc.moveDown();
        
        const unfilledTop = doc.y;
        
        doc.fontSize(10);
        doc.text('Date', tableLeft, unfilledTop);
        doc.text('Shift Type', tableLeft + colWidth, unfilledTop);
        
        doc.moveTo(tableLeft, unfilledTop - 5)
          .lineTo(tableLeft + colWidth * 2, unfilledTop - 5)
          .stroke();
        
        doc.moveTo(tableLeft, unfilledTop + 15)
          .lineTo(tableLeft + colWidth * 2, unfilledTop + 15)
          .stroke();
        
        let unfilledRowTop = unfilledTop + 20;
        
        for (const shift of scheduleData.schedule.unfilled) {
          const date = new Date(shift.date).toLocaleDateString();
          doc.text(date, tableLeft, unfilledRowTop);
          doc.text(shift.type, tableLeft + colWidth, unfilledRowTop);
          
          unfilledRowTop += 20;
        }
      }
      
      // Finalize PDF
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate CSV file for schedule
 * @param {Object} scheduleData - Schedule data
 * @param {string} outputPath - Path to save CSV
 */
const generateScheduleCSV = async (scheduleData, outputPath) => {
  // Sort assignments by date
  const sortedAssignments = [...scheduleData.schedule.assignments].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  
  // Prepare data for CSV
  const records = sortedAssignments.map(assignment => ({
    date: new Date(assignment.date).toISOString().split('T')[0],
    shiftType: assignment.type,
    doctorId: assignment.doctorId,
    doctorName: assignment.doctorName
  }));
  
  // Create CSV writer
  const csvWriter = createCsvWriter({
    path: outputPath,
    header: [
      { id: 'date', title: 'Date' },
      { id: 'shiftType', title: 'Shift Type' },
      { id: 'doctorId', title: 'Doctor ID' },
      { id: 'doctorName', title: 'Doctor Name' }
    ]
  });
  
  // Write CSV file
  return csvWriter.writeRecords(records);
};

/**
 * List all available schedules
 * @returns {Array} List of schedules
 */
const listSchedules = async () => {
  const processedDir = path.join(__dirname, '../../data/processed');
  const files = fs.readdirSync(processedDir);
  
  // Find schedule files
  const scheduleFiles = files.filter(file => file.startsWith('schedule_') && file.endsWith('.json'));
  
  // Load basic info for each schedule
  const schedules = scheduleFiles.map(file => {
    const filePath = path.join(processedDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    return {
      id: data.id,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      createdAt: data.createdAt,
      modifiedAt: data.modifiedAt,
      totalShifts: data.statistics.totalShifts,
      unfilledShifts: data.statistics.unfilledShifts
    };
  });
  
  // Sort by creation date (newest first)
  return schedules.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Load doctor data from the most recent processed file
 * @returns {Object} Doctor data
 */
const loadDoctorData = async () => {
  const processedDir = path.join(__dirname, '../../data/processed');
  const files = fs.readdirSync(processedDir);
  
  // Find the most recent doctors processed file
  const doctorsFiles = files.filter(file => file.startsWith('doctors_processed_'));
  if (doctorsFiles.length === 0) {
    return null;
  }
  
  // Sort by timestamp (newest first)
  doctorsFiles.sort((a, b) => {
    const timestampA = parseInt(a.split('_')[2].split('.')[0], 10);
    const timestampB = parseInt(b.split('_')[2].split('.')[0], 10);
    return timestampB - timestampA;
  });
  
  const latestFile = path.join(processedDir, doctorsFiles[0]);
  return JSON.parse(fs.readFileSync(latestFile, 'utf8'));
};

/**
 * Load performance data from the most recent processed file
 * @returns {Object} Performance data
 */
const loadPerformanceData = async () => {
  const processedDir = path.join(__dirname, '../../data/processed');
  const files = fs.readdirSync(processedDir);
  
  // Find the most recent performance processed file
  const performanceFiles = files.filter(file => file.startsWith('performance_processed_'));
  if (performanceFiles.length === 0) {
    return null;
  }
  
  // Sort by timestamp (newest first)
  performanceFiles.sort((a, b) => {
    const timestampA = parseInt(a.split('_')[2].split('.')[0], 10);
    const timestampB = parseInt(b.split('_')[2].split('.')[0], 10);
    return timestampB - timestampA;
  });
  
  const latestFile = path.join(processedDir, performanceFiles[0]);
  return JSON.parse(fs.readFileSync(latestFile, 'utf8'));
};

/**
 * Generate shifts for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} List of shifts
 */
const generateShiftsForDateRange = (startDate, endDate) => {
  const shifts = [];
  const currentDate = new Date(startDate);
  let shiftId = 1;
  
  while (currentDate <= endDate) {
    // Add day shift
    shifts.push({
      id: `shift_${shiftId++}`,
      date: new Date(currentDate).toISOString(),
      type: 'day',
      requiresTEMI: true, // At least one TEMI qualified doctor per shift
      requiresAMIB: false,
      requiresResident: false
    });
    
    // Add night shift
    shifts.push({
      id: `shift_${shiftId++}`,
      date: new Date(currentDate).toISOString(),
      type: 'night',
      requiresTEMI: true, // At least one TEMI qualified doctor per shift
      requiresAMIB: false,
      requiresResident: false
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return shifts;
};

/**
 * Calculate statistics for a schedule
 * @param {Object} schedule - Schedule object
 * @param {Array} doctors - List of all doctors
 * @returns {Object} Schedule statistics
 */
const calculateScheduleStatistics = (schedule, doctors) => {
  const statistics = {
    totalShifts: schedule.assignments.length,
    unfilledShifts: schedule.unfilled.length,
    coverageRate: 0,
    doctorStats: {},
    shiftTypeDistribution: {
      day: 0,
      night: 0,
      weekend: 0
    }
  };
  
  // Calculate coverage rate
  const totalShifts = schedule.assignments.length + schedule.unfilled.length;
  statistics.coverageRate = totalShifts > 0 ? schedule.assignments.length / totalShifts : 0;
  
  // Calculate doctor statistics
  doctors.forEach(doctor => {
    const doctorShifts = schedule.doctorAssignments[doctor.id] || [];
    const shiftCounts = schedule.shiftCounts[doctor.id] || { total: 0, day: 0, night: 0, weekend: 0 };
    
    statistics.doctorStats[doctor.id] = {
      name: doctor.name,
      totalShifts: shiftCounts.total,
      dayShifts: shiftCounts.day,
      nightShifts: shiftCounts.night,
      weekendShifts: shiftCounts.weekend
    };
    
    // Update shift type distribution
    statistics.shiftTypeDistribution.day += shiftCounts.day;
    statistics.shiftTypeDistribution.night += shiftCounts.night;
    statistics.shiftTypeDistribution.weekend += shiftCounts.weekend;
  });
  
  return statistics;
};

module.exports = {
  generateSchedule,
  getSchedule,
  updateSchedule,
  approveSchedule,
  publishSchedule,
  exportSchedule
};