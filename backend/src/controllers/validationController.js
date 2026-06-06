const { ValidationReport, MigrationJob } = require('../models');
const { validateMigration } = require('../services/validationService');

const runValidation = async (req, res, next) => {
  try {
    const job = await MigrationJob.findByPk(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Migration job not found' });
    if (!['completed', 'running'].includes(job.status))
      return res.status(400).json({ success: false, message: 'Job must be completed before validation' });

    // Run async, send immediate response
    res.json({ success: true, message: 'Validation started', data: { job_id: req.params.id } });
    validateMigration(req.params.id).catch(console.error);
  } catch (err) { next(err); }
};

const getReport = async (req, res, next) => {
  try {
    const reports = await ValidationReport.findAll({
      where: { job_id: req.params.id },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: reports });
  } catch (err) { next(err); }
};

module.exports = { runValidation, getReport };
