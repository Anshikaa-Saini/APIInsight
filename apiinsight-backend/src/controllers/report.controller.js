const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const reportService = require('../services/report.service');

const generateReport = asyncHandler(async (req, res) => {
  const report = await reportService.generateReport(req.user._id, req.params.projectId);
  sendSuccess(res, 201, { report }, 'Report generated');
});

const getLatestReport = asyncHandler(async (req, res) => {
  const report = await reportService.getLatestReport(req.user._id, req.params.projectId);
  sendSuccess(res, 200, { report });
});

const getReportHistory = asyncHandler(async (req, res) => {
  const reports = await reportService.getReportHistory(req.user._id, req.params.projectId);
  sendSuccess(res, 200, { reports });
});

module.exports = { generateReport, getLatestReport, getReportHistory };
