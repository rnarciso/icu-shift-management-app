const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { validationResult } = require('express-validator');

/**
 * Handle CSV file uploads (doctors list and past performance data)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadCSV = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { dataType } = req.body;
    if (!['doctors', 'performance'].includes(dataType)) {
      return res.status(400).json({ message: 'Invalid data type specified' });
    }

    // Save file to appropriate location
    const uploadDir = path.join(__dirname, '../../data/raw');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${dataType}_${Date.now()}.csv`;
    const filePath = path.join(uploadDir, fileName);
    
    fs.writeFileSync(filePath, req.file.buffer);

    // Process the file
    const processResult = await processCSV(filePath, dataType);
    
    return res.status(200).json({
      message: 'File uploaded and processed successfully',
      fileName,
      processedRecords: processResult.count,
      summary: processResult.summary
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return res.status(500).json({ message: 'Error uploading CSV file', error: error.message });
  }
};

/**
 * Process and validate uploaded CSV files
 * @param {string} filePath - Path to the CSV file
 * @param {string} dataType - Type of data (doctors or performance)
 * @returns {Object} - Processing results
 */
const processCSV = async (filePath, dataType) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let count = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        count++;
        
        // Validate data based on type
        const validationResult = validateCSVRow(data, dataType);
        
        if (validationResult.valid) {
          results.push(validationResult.data);
        } else {
          errors.push({ row: count, errors: validationResult.errors });
        }
      })
      .on('end', async () => {
        try {
          // Save processed data
          const processedDir = path.join(__dirname, '../../data/processed');
          if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
          }
          
          const processedFilePath = path.join(processedDir, `${dataType}_processed_${Date.now()}.json`);
          fs.writeFileSync(processedFilePath, JSON.stringify({
            data: results,
            errors,
            metadata: {
              originalFile: path.basename(filePath),
              processedAt: new Date().toISOString(),
              totalRecords: count,
              validRecords: results.length,
              errorRecords: errors.length
            }
          }, null, 2));
          
          resolve({
            count,
            summary: {
              totalRecords: count,
              validRecords: results.length,
              errorRecords: errors.length
            }
          });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Validate a CSV row based on data type
 * @param {Object} row - CSV row data
 * @param {string} dataType - Type of data (doctors or performance)
 * @returns {Object} - Validation result
 */
const validateCSVRow = (row, dataType) => {
  const errors = [];
  let processedData = { ...row };
  
  if (dataType === 'doctors') {
    // Validate doctor data
    if (!row.id) errors.push('Missing doctor ID');
    if (!row.name) errors.push('Missing doctor name');
    
    // Validate qualifications
    if (row.temi !== undefined) {
      processedData.temi = row.temi.toLowerCase() === 'true' || row.temi === '1';
    } else {
      errors.push('Missing TEMI qualification status');
    }
    
    if (row.amib !== undefined) {
      processedData.amib = row.amib.toLowerCase() === 'true' || row.amib === '1';
    } else {
      errors.push('Missing AMIB qualification status');
    }
    
    // Validate residence status
    if (row.residence !== undefined) {
      processedData.residence = row.residence.toLowerCase() === 'true' || row.residence === '1';
    } else {
      errors.push('Missing residence status');
    }
    
    // Validate tenure
    if (row.tenure) {
      const tenure = parseInt(row.tenure, 10);
      if (isNaN(tenure)) {
        errors.push('Tenure must be a number');
      } else {
        processedData.tenure = tenure;
      }
    } else {
      errors.push('Missing tenure information');
    }
  } else if (dataType === 'performance') {
    // Validate performance data
    if (!row.doctorId) errors.push('Missing doctor ID');
    if (!row.month || !row.year) errors.push('Missing time period');
    
    // Validate shift counts
    if (row.expectedShifts) {
      const expectedShifts = parseInt(row.expectedShifts, 10);
      if (isNaN(expectedShifts)) {
        errors.push('Expected shifts must be a number');
      } else {
        processedData.expectedShifts = expectedShifts;
      }
    } else {
      errors.push('Missing expected shifts count');
    }
    
    if (row.actualShifts) {
      const actualShifts = parseInt(row.actualShifts, 10);
      if (isNaN(actualShifts)) {
        errors.push('Actual shifts must be a number');
      } else {
        processedData.actualShifts = actualShifts;
      }
    } else {
      errors.push('Missing actual shifts count');
    }
  }
  
  return {
    valid: errors.length === 0,
    data: processedData,
    errors
  };
};

/**
 * Retrieve processed doctor data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDoctorsList = async (req, res) => {
  try {
    const processedDir = path.join(__dirname, '../../data/processed');
    const files = fs.readdirSync(processedDir);
    
    // Find the most recent doctors processed file
    const doctorsFiles = files.filter(file => file.startsWith('doctors_processed_'));
    if (doctorsFiles.length === 0) {
      return res.status(404).json({ message: 'No processed doctor data found' });
    }
    
    // Sort by timestamp (newest first)
    doctorsFiles.sort((a, b) => {
      const timestampA = parseInt(a.split('_')[2].split('.')[0], 10);
      const timestampB = parseInt(b.split('_')[2].split('.')[0], 10);
      return timestampB - timestampA;
    });
    
    const latestFile = path.join(processedDir, doctorsFiles[0]);
    const doctorsData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    
    return res.status(200).json({
      data: doctorsData.data,
      metadata: doctorsData.metadata
    });
  } catch (error) {
    console.error('Error retrieving doctors list:', error);
    return res.status(500).json({ message: 'Error retrieving doctors list', error: error.message });
  }
};

/**
 * Retrieve processed performance data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPerformanceData = async (req, res) => {
  try {
    const processedDir = path.join(__dirname, '../../data/processed');
    const files = fs.readdirSync(processedDir);
    
    // Find the most recent performance processed file
    const performanceFiles = files.filter(file => file.startsWith('performance_processed_'));
    if (performanceFiles.length === 0) {
      return res.status(404).json({ message: 'No processed performance data found' });
    }
    
    // Sort by timestamp (newest first)
    performanceFiles.sort((a, b) => {
      const timestampA = parseInt(a.split('_')[2].split('.')[0], 10);
      const timestampB = parseInt(b.split('_')[2].split('.')[0], 10);
      return timestampB - timestampA;
    });
    
    const latestFile = path.join(processedDir, performanceFiles[0]);
    const performanceData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    
    // Filter by doctor ID if provided
    if (req.query.doctorId) {
      performanceData.data = performanceData.data.filter(
        record => record.doctorId === req.query.doctorId
      );
    }
    
    return res.status(200).json({
      data: performanceData.data,
      metadata: performanceData.metadata
    });
  } catch (error) {
    console.error('Error retrieving performance data:', error);
    return res.status(500).json({ message: 'Error retrieving performance data', error: error.message });
  }
};

/**
 * Export data in CSV format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportData = async (req, res) => {
  try {
    const { dataType } = req.params;
    if (!['doctors', 'performance'].includes(dataType)) {
      return res.status(400).json({ message: 'Invalid data type specified' });
    }
    
    const processedDir = path.join(__dirname, '../../data/processed');
    const files = fs.readdirSync(processedDir);
    
    // Find the most recent processed file of the specified type
    const typeFiles = files.filter(file => file.startsWith(`${dataType}_processed_`));
    if (typeFiles.length === 0) {
      return res.status(404).json({ message: `No processed ${dataType} data found` });
    }
    
    // Sort by timestamp (newest first)
    typeFiles.sort((a, b) => {
      const timestampA = parseInt(a.split('_')[2].split('.')[0], 10);
      const timestampB = parseInt(b.split('_')[2].split('.')[0], 10);
      return timestampB - timestampA;
    });
    
    const latestFile = path.join(processedDir, typeFiles[0]);
    const jsonData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    
    // Create CSV file
    const exportDir = path.join(__dirname, '../../data/exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const exportFilePath = path.join(exportDir, `${dataType}_export_${Date.now()}.csv`);
    
    // Determine headers based on data type
    let headers = [];
    if (dataType === 'doctors') {
      headers = [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' },
        { id: 'temi', title: 'TEMI' },
        { id: 'amib', title: 'AMIB' },
        { id: 'residence', title: 'Residence' },
        { id: 'tenure', title: 'Tenure' }
      ];
    } else {
      headers = [
        { id: 'doctorId', title: 'Doctor ID' },
        { id: 'month', title: 'Month' },
        { id: 'year', title: 'Year' },
        { id: 'expectedShifts', title: 'Expected Shifts' },
        { id: 'actualShifts', title: 'Actual Shifts' }
      ];
    }
    
    const csvWriter = createCsvWriter({
      path: exportFilePath,
      header: headers
    });
    
    await csvWriter.writeRecords(jsonData.data);
    
    // Send file to client
    res.download(exportFilePath, `${dataType}_export.csv`, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      
      // Clean up file after sending
      fs.unlinkSync(exportFilePath);
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return res.status(500).json({ message: 'Error exporting data', error: error.message });
  }
};

module.exports = {
  uploadCSV,
  processCSV,
  getDoctorsList,
  getPerformanceData,
  exportData
};