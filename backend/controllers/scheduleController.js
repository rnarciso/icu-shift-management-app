
const schedulerService = require('../services/scheduler/scheduler.service');
const { validationResult } = require('express-validator');

const generateSchedule = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, constraints } = req.body;

    try {
        const schedule = await schedulerService.generateSchedule(startDate, endDate, constraints);
        res.status(200).json(schedule);
    } catch (error) {
        next(error);
    }
};

const getSchedule = async (req, res, next) => {
    try {
        const schedule = await schedulerService.getSchedule(req.params.scheduleId);
        res.status(200).json(schedule);
    } catch (error) {
        next(error);
    }
};

const updateSchedule = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const updatedSchedule = await schedulerService.updateSchedule(req.params.scheduleId, req.body.assignments);
        res.status(200).json(updatedSchedule);
    } catch (error) {
        next(error);
    }
};

const approveSchedule = async (req, res, next) => {
    try {
        const approvedSchedule = await schedulerService.approveSchedule(req.params.scheduleId);
        res.status(200).json(approvedSchedule);
    } catch (error) {
        next(error);
    }
};

const publishSchedule = async (req, res, next) => {
    try {
        const publishedSchedule = await schedulerService.publishSchedule(req.params.scheduleId);
        res.status(200).json(publishedSchedule);
    } catch (error) {
        next(error);
    }
};

const exportSchedule = async (req, res, next) => {
    try {
        const { scheduleId } = req.params;
        const { format } = req.query;
        const filePath = await schedulerService.exportSchedule(scheduleId, format);
        res.download(filePath);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateSchedule,
    getSchedule,
    updateSchedule,
    approveSchedule,
    publishSchedule,
    exportSchedule
};
