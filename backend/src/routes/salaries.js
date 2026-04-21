const express = require("express");
const { listSalaries } = require("../data/store");

const router = express.Router();

router.get("/", (_req, res) => {
  const salaries = listSalaries();

  res.json({
    data: salaries,
    count: salaries.length
  });
});

module.exports = router;
