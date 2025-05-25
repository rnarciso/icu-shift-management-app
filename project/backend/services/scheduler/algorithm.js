/**
 * ICU Shift Scheduling Algorithm
 * 
 * This module implements a constraint-based scheduling algorithm for ICU shifts
 * that prioritizes qualification requirements, doctor preferences, and ensures
 * 24/7 coverage while following tie-breaking rules.
 */

/**
 * Generate a schedule for the specified time period
 * @param {Object} params - Scheduling parameters
 * @param {Array} params.doctors - List of doctors with their qualifications and preferences
 * @param {Array} params.shifts - List of shifts to be scheduled
 * @param {Array} params.performance - Past performance data for doctors
 * @param {Object} params.constraints - Scheduling constraints
 * @returns {Object} Generated schedule with assignments and statistics
 */
const generateSchedule = async (params) => {
  const { doctors, shifts, performance, constraints } = params;
  
  // Initialize empty schedule
  const schedule = initializeSchedule(shifts);
  
  // Sort shifts by priority (e.g., weekend shifts first, night shifts)
  const sortedShifts = sortShiftsByPriority(shifts);
  
  // Process each shift
  for (const shift of sortedShifts) {
    // Find eligible doctors for this shift
    const eligibleDoctors = findEligibleDoctors(shift, doctors, schedule, constraints);
    
    // If no eligible doctors, mark as unfilled and continue
    if (eligibleDoctors.length === 0) {
      schedule.unfilled.push(shift);
      continue;
    }
    
    // Rank eligible doctors based on qualifications, preferences, and tie-breaking rules
    const rankedDoctors = rankDoctors(eligibleDoctors, shift, performance, schedule);
    
    // Assign the highest-ranked doctor to the shift
    const assignedDoctor = rankedDoctors[0];
    assignShift(schedule, shift, assignedDoctor);
  }
  
  // Calculate schedule statistics
  const statistics = calculateScheduleStatistics(schedule, doctors);
  
  return {
    schedule,
    statistics,
    unfilled: schedule.unfilled
  };
};

/**
 * Initialize an empty schedule
 * @param {Array} shifts - List of shifts to be scheduled
 * @returns {Object} Empty schedule structure
 */
const initializeSchedule = (shifts) => {
  return {
    assignments: [], // Will contain { shiftId, doctorId, date, type }
    doctorAssignments: {}, // Map of doctorId to assigned shifts
    shiftCounts: {}, // Count of shifts by type for each doctor
    unfilled: [] // Shifts that couldn't be filled
  };
};

/**
 * Sort shifts by priority for scheduling
 * @param {Array} shifts - List of shifts to be scheduled
 * @returns {Array} Sorted shifts
 */
const sortShiftsByPriority = (shifts) => {
  // Sort by date and priority
  return [...shifts].sort((a, b) => {
    // First sort by date
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // Then by priority (weekend > night > day)
    const priorityMap = { night: 2, day: 1 };
    const isWeekendA = [0, 6].includes(dateA.getDay()); // Sunday or Saturday
    const isWeekendB = [0, 6].includes(dateB.getDay());
    
    if (isWeekendA !== isWeekendB) {
      return isWeekendB ? -1 : 1; // Weekend shifts first
    }
    
    return priorityMap[b.type] - priorityMap[a.type]; // Higher priority shifts first
  });
};

/**
 * Find eligible doctors for a specific shift
 * @param {Object} shift - Shift to be assigned
 * @param {Array} doctors - List of all doctors
 * @param {Object} schedule - Current schedule state
 * @param {Object} constraints - Scheduling constraints
 * @returns {Array} List of eligible doctors
 */
const findEligibleDoctors = (shift, doctors, schedule, constraints) => {
  return doctors.filter(doctor => {
    // Check if doctor is available for this shift
    if (!isDoctorAvailable(doctor, shift, schedule)) {
      return false;
    }
    
    // Check if doctor meets qualification requirements for this shift
    if (!meetsQualificationRequirements(doctor, shift)) {
      return false;
    }
    
    // Check if assigning this shift would violate any constraints
    if (violatesConstraints(doctor, shift, schedule, constraints)) {
      return false;
    }
    
    return true;
  });
};

/**
 * Check if a doctor is available for a specific shift
 * @param {Object} doctor - Doctor to check
 * @param {Object} shift - Shift to be assigned
 * @param {Object} schedule - Current schedule state
 * @returns {boolean} Whether the doctor is available
 */
const isDoctorAvailable = (doctor, shift, schedule) => {
  // Check if doctor has specified availability
  if (doctor.availability) {
    const shiftDate = new Date(shift.date);
    const dayOfWeek = shiftDate.getDay();
    const shiftType = shift.type;
    
    // Check if doctor is available for this day and shift type
    if (!doctor.availability[dayOfWeek] || !doctor.availability[dayOfWeek][shiftType]) {
      return false;
    }
  }
  
  // Check if doctor is already assigned to a shift on the same day
  const doctorAssignments = schedule.doctorAssignments[doctor.id] || [];
  const shiftDate = new Date(shift.date).toISOString().split('T')[0];
  
  const hasConflictingShift = doctorAssignments.some(assignment => {
    const assignmentDate = new Date(assignment.date).toISOString().split('T')[0];
    return assignmentDate === shiftDate;
  });
  
  return !hasConflictingShift;
};

/**
 * Check if a doctor meets qualification requirements for a shift
 * @param {Object} doctor - Doctor to check
 * @param {Object} shift - Shift to be assigned
 * @returns {boolean} Whether the doctor meets requirements
 */
const meetsQualificationRequirements = (doctor, shift) => {
  // Check specific qualification requirements
  if (shift.requiresTEMI && !doctor.temi) {
    return false;
  }
  
  if (shift.requiresAMIB && !doctor.amib) {
    return false;
  }
  
  // Check residence status requirements
  if (shift.requiresResident && !doctor.residence) {
    return false;
  }
  
  return true;
};

/**
 * Check if assigning a shift would violate constraints
 * @param {Object} doctor - Doctor to check
 * @param {Object} shift - Shift to be assigned
 * @param {Object} schedule - Current schedule state
 * @param {Object} constraints - Scheduling constraints
 * @returns {boolean} Whether constraints would be violated
 */
const violatesConstraints = (doctor, shift, schedule, constraints) => {
  const doctorAssignments = schedule.doctorAssignments[doctor.id] || [];
  const shiftDate = new Date(shift.date);
  
  // Check maximum consecutive shifts
  if (constraints.maxConsecutiveShifts) {
    const consecutiveShifts = getConsecutiveShifts(doctor.id, shiftDate, schedule);
    if (consecutiveShifts >= constraints.maxConsecutiveShifts) {
      return true;
    }
  }
  
  // Check maximum shifts per week
  if (constraints.maxShiftsPerWeek) {
    const shiftsThisWeek = getShiftsInWeek(doctor.id, shiftDate, schedule);
    if (shiftsThisWeek >= constraints.maxShiftsPerWeek) {
      return true;
    }
  }
  
  // Check maximum night shifts per week
  if (constraints.maxNightShiftsPerWeek && shift.type === 'night') {
    const nightShiftsThisWeek = getShiftsInWeek(doctor.id, shiftDate, schedule, 'night');
    if (nightShiftsThisWeek >= constraints.maxNightShiftsPerWeek) {
      return true;
    }
  }
  
  // Check minimum rest time between shifts
  if (constraints.minRestHours) {
    const hasInsufficientRest = doctorAssignments.some(assignment => {
      const assignmentDate = new Date(assignment.date);
      const hoursBetween = Math.abs(shiftDate - assignmentDate) / (60 * 60 * 1000);
      return hoursBetween < constraints.minRestHours;
    });
    
    if (hasInsufficientRest) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get the number of consecutive shifts for a doctor
 * @param {string} doctorId - Doctor ID
 * @param {Date} date - Shift date
 * @param {Object} schedule - Current schedule state
 * @returns {number} Number of consecutive shifts
 */
const getConsecutiveShifts = (doctorId, date, schedule) => {
  const doctorAssignments = schedule.doctorAssignments[doctorId] || [];
  let consecutiveShifts = 0;
  
  // Check previous days
  for (let i = 1; i <= 7; i++) {
    const prevDate = new Date(date);
    prevDate.setDate(date.getDate() - i);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    
    const hasShiftOnDay = doctorAssignments.some(assignment => {
      const assignmentDate = new Date(assignment.date).toISOString().split('T')[0];
      return assignmentDate === prevDateStr;
    });
    
    if (hasShiftOnDay) {
      consecutiveShifts++;
    } else {
      break;
    }
  }
  
  return consecutiveShifts;
};

/**
 * Get the number of shifts in the same week
 * @param {string} doctorId - Doctor ID
 * @param {Date} date - Shift date
 * @param {Object} schedule - Current schedule state
 * @param {string} shiftType - Optional shift type filter
 * @returns {number} Number of shifts in the week
 */
const getShiftsInWeek = (doctorId, date, schedule, shiftType = null) => {
  const doctorAssignments = schedule.doctorAssignments[doctorId] || [];
  
  // Get start and end of week (Sunday to Saturday)
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  // Count shifts in this week
  return doctorAssignments.filter(assignment => {
    const assignmentDate = new Date(assignment.date);
    const isInWeek = assignmentDate >= startOfWeek && assignmentDate <= endOfWeek;
    return isInWeek && (shiftType === null || assignment.type === shiftType);
  }).length;
};

/**
 * Rank doctors based on qualifications, preferences, and tie-breaking rules
 * @param {Array} doctors - List of eligible doctors
 * @param {Object} shift - Shift to be assigned
 * @param {Array} performance - Past performance data
 * @param {Object} schedule - Current schedule state
 * @returns {Array} Ranked list of doctors
 */
const rankDoctors = (doctors, shift, performance, schedule) => {
  return [...doctors].sort((a, b) => {
    // 1. First priority: Doctor preferences
    const prefA = getPreferenceScore(a, shift);
    const prefB = getPreferenceScore(b, shift);
    
    if (prefA !== prefB) {
      return prefB - prefA; // Higher preference score first
    }
    
    // 2. Tie-breaker: TEMI status
    if (a.temi !== b.temi) {
      return a.temi ? -1 : 1; // TEMI qualified doctors first
    }
    
    // 3. Tie-breaker: Residence status
    if (a.residence !== b.residence) {
      return a.residence ? -1 : 1; // Residents first
    }
    
    // 4. Tie-breaker: Past performance (balance between expected and actual shifts)
    const balanceA = getPerformanceBalance(a.id, performance);
    const balanceB = getPerformanceBalance(b.id, performance);
    
    if (balanceA !== balanceB) {
      return balanceA - balanceB; // Doctors who have done fewer shifts than expected first
    }
    
    // 5. Tie-breaker: Tenure (time with UTI)
    if (a.tenure !== b.tenure) {
      return b.tenure - a.tenure; // More experienced doctors first
    }
    
    // 6. Tie-breaker: Current schedule balance
    const currentShiftsA = (schedule.doctorAssignments[a.id] || []).length;
    const currentShiftsB = (schedule.doctorAssignments[b.id] || []).length;
    
    return currentShiftsA - currentShiftsB; // Doctors with fewer assigned shifts first
  });
};

/**
 * Calculate preference score for a doctor and shift
 * @param {Object} doctor - Doctor object
 * @param {Object} shift - Shift object
 * @returns {number} Preference score (higher is better)
 */
const getPreferenceScore = (doctor, shift) => {
  if (!doctor.preferences) {
    return 0;
  }
  
  const shiftDate = new Date(shift.date);
  const dayOfWeek = shiftDate.getDay();
  const shiftType = shift.type;
  
  // Check if doctor has preference for this day and shift type
  if (doctor.preferences[dayOfWeek] && doctor.preferences[dayOfWeek][shiftType] !== undefined) {
    return doctor.preferences[dayOfWeek][shiftType];
  }
  
  return 0;
};

/**
 * Calculate performance balance (expected - actual shifts)
 * @param {string} doctorId - Doctor ID
 * @param {Array} performance - Past performance data
 * @returns {number} Performance balance
 */
const getPerformanceBalance = (doctorId, performance) => {
  const doctorPerformance = performance.filter(p => p.doctorId === doctorId);
  
  if (doctorPerformance.length === 0) {
    return 0;
  }
  
  // Calculate total expected and actual shifts
  const totalExpected = doctorPerformance.reduce((sum, p) => sum + p.expectedShifts, 0);
  const totalActual = doctorPerformance.reduce((sum, p) => sum + p.actualShifts, 0);
  
  return totalExpected - totalActual;
};

/**
 * Assign a shift to a doctor in the schedule
 * @param {Object} schedule - Schedule object
 * @param {Object} shift - Shift to assign
 * @param {Object} doctor - Doctor to assign
 */
const assignShift = (schedule, shift, doctor) => {
  const assignment = {
    shiftId: shift.id,
    doctorId: doctor.id,
    doctorName: doctor.name,
    date: shift.date,
    type: shift.type
  };
  
  // Add to assignments list
  schedule.assignments.push(assignment);
  
  // Update doctor assignments
  if (!schedule.doctorAssignments[doctor.id]) {
    schedule.doctorAssignments[doctor.id] = [];
  }
  schedule.doctorAssignments[doctor.id].push(assignment);
  
  // Update shift counts
  if (!schedule.shiftCounts[doctor.id]) {
    schedule.shiftCounts[doctor.id] = {
      total: 0,
      day: 0,
      night: 0,
      weekend: 0
    };
  }
  
  schedule.shiftCounts[doctor.id].total++;
  schedule.shiftCounts[doctor.id][shift.type]++;
  
  const shiftDate = new Date(shift.date);
  if ([0, 6].includes(shiftDate.getDay())) { // Sunday or Saturday
    schedule.shiftCounts[doctor.id].weekend++;
  }
};

/**
 * Calculate statistics for the generated schedule
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

/**
 * Validate a schedule against constraints
 * @param {Object} schedule - Schedule to validate
 * @param {Array} doctors - List of all doctors
 * @param {Object} constraints - Scheduling constraints
 * @returns {Object} Validation results with any violations
 */
const validateSchedule = (schedule, doctors, constraints) => {
  const violations = [];
  
  // Check for each doctor
  doctors.forEach(doctor => {
    const doctorAssignments = schedule.doctorAssignments[doctor.id] || [];
    
    // Check maximum shifts per week
    if (constraints.maxShiftsPerWeek) {
      const weeklyShifts = countWeeklyShifts(doctorAssignments);
      
      Object.entries(weeklyShifts).forEach(([weekKey, count]) => {
        if (count > constraints.maxShiftsPerWeek) {
          violations.push({
            type: 'maxShiftsPerWeek',
            doctorId: doctor.id,
            doctorName: doctor.name,
            week: weekKey,
            count,
            limit: constraints.maxShiftsPerWeek
          });
        }
      });
    }
    
    // Check maximum night shifts per week
    if (constraints.maxNightShiftsPerWeek) {
      const weeklyNightShifts = countWeeklyShifts(
        doctorAssignments.filter(a => a.type === 'night')
      );
      
      Object.entries(weeklyNightShifts).forEach(([weekKey, count]) => {
        if (count > constraints.maxNightShiftsPerWeek) {
          violations.push({
            type: 'maxNightShiftsPerWeek',
            doctorId: doctor.id,
            doctorName: doctor.name,
            week: weekKey,
            count,
            limit: constraints.maxNightShiftsPerWeek
          });
        }
      });
    }
    
    // Check minimum rest time between shifts
    if (constraints.minRestHours) {
      const sortedAssignments = [...doctorAssignments].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      
      for (let i = 1; i < sortedAssignments.length; i++) {
        const prevShift = sortedAssignments[i - 1];
        const currShift = sortedAssignments[i];
        
        const prevDate = new Date(prevShift.date);
        const currDate = new Date(currShift.date);
        const hoursBetween = (currDate - prevDate) / (60 * 60 * 1000);
        
        if (hoursBetween < constraints.minRestHours) {
          violations.push({
            type: 'minRestHours',
            doctorId: doctor.id,
            doctorName: doctor.name,
            shift1: prevShift,
            shift2: currShift,
            hoursBetween,
            limit: constraints.minRestHours
          });
        }
      }
    }
  });
  
  return {
    valid: violations.length === 0,
    violations
  };
};

/**
 * Count shifts per week for a doctor
 * @param {Array} assignments - Doctor's shift assignments
 * @returns {Object} Map of week keys to shift counts
 */
const countWeeklyShifts = (assignments) => {
  const weeklyShifts = {};
  
  assignments.forEach(assignment => {
    const date = new Date(assignment.date);
    const weekKey = getWeekKey(date);
    
    if (!weeklyShifts[weekKey]) {
      weeklyShifts[weekKey] = 0;
    }
    
    weeklyShifts[weekKey]++;
  });
  
  return weeklyShifts;
};

/**
 * Get a string key for a week (YYYY-WW)
 * @param {Date} date - Date to get week key for
 * @returns {string} Week key
 */
const getWeekKey = (date) => {
  const year = date.getFullYear();
  
  // Get first day of year
  const firstDay = new Date(year, 0, 1);
  
  // Calculate days since first day
  const daysSinceFirst = Math.floor((date - firstDay) / (24 * 60 * 60 * 1000));
  
  // Calculate week number (0-indexed)
  const weekNumber = Math.floor(daysSinceFirst / 7);
  
  return `${year}-${weekNumber + 1}`;
};

module.exports = {
  generateSchedule,
  validateSchedule
};