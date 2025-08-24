
const { Op } = require('sequelize');
const models = require('../../models');
const logger = require('../../utils/logger');
const schedulerAlgorithm = require('./algorithm');

class SchedulerService {
    async generateSchedule(startDate, endDate, constraints) {
        const doctors = await models.Doctor.findAll({ include: [models.Qualification, models.Preference] });
        const shifts = this.generateShiftsForDateRange(new Date(startDate), new Date(endDate));
        const performance = await models.Performance.findAll();

        const scheduleResult = await schedulerAlgorithm.generateSchedule({
            doctors,
            shifts,
            performance,
            constraints
        });

        const validationResult = schedulerAlgorithm.validateSchedule(
            scheduleResult.schedule,
            doctors,
            constraints
        );

        // Save the schedule
        const schedule = await models.Schedule.create({
            startDate,
            endDate,
            constraints,
            schedule: scheduleResult.schedule,
            statistics: scheduleResult.statistics,
            validation: validationResult,
            status: 'draft'
        });

        return { scheduleId: schedule.id, ...scheduleResult };
    }

    async getSchedule(scheduleId) {
        return await models.Schedule.findByPk(scheduleId);
    }

    async updateSchedule(scheduleId, assignments) {
        const schedule = await models.Schedule.findByPk(scheduleId);
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        // Logic to update assignments

        await schedule.save();
        return schedule;
    }

    async approveSchedule(scheduleId) {
        const schedule = await models.Schedule.findByPk(scheduleId);
        if (!schedule) {
            throw new Error('Schedule not found');
        }
        schedule.status = 'approved';
        await schedule.save();
        return schedule;
    }

    async publishSchedule(scheduleId) {
        const schedule = await models.Schedule.findByPk(scheduleId);
        if (!schedule) {
            throw new Error('Schedule not found');
        }
        schedule.status = 'published';
        await schedule.save();
        return schedule;
    }

    async exportSchedule(scheduleId, format) {
        const schedule = await models.Schedule.findByPk(scheduleId);
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        if (format === 'pdf') {
            // PDF generation logic
        } else if (format === 'csv') {
            // CSV generation logic
        }
    }

    generateShiftsForDateRange(startDate, endDate) {
        const shifts = [];
        let currentDate = new Date(startDate);
        let shiftId = 1;

        while (currentDate <= endDate) {
            shifts.push({
                id: `shift_${shiftId++}`,
                date: new Date(currentDate).toISOString(),
                type: 'day'
            });

            shifts.push({
                id: `shift_${shiftId++}`,
                date: new Date(currentDate).toISOString(),
                type: 'night'
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return shifts;
    }
}

module.exports = new SchedulerService();
