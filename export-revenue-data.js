#!/usr/bin/env node

/**
 * Heart Smart Revenue Export Script (Node.js)
 *
 * Prerequisites:
 * 1. Install dependencies: npm install --save @google-cloud/bigquery
 * 2. Set up authentication: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
 * 3. Run: node export-revenue-data.js
 */

const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const path = require('path');

const bigquery = new BigQuery({
  projectId: 'jv-data-warehouse',
});

async function fetchRevenueTransactions() {
  console.log('Fetching revenue transactions from BigQuery...');

  const query = `
    SELECT
      date,
      name,
      email,
      product,
      CAST(amount AS FLOAT64) as amount,
      attribution_source
    FROM \`jv-data-warehouse.heart_smart_au.revenue_transactions_enriched\`
    ORDER BY date DESC
  `;

  const options = {
    query: query,
    location: 'US',
  };

  const [rows] = await bigquery.query(options);
  console.log(`  Found ${rows.length} transactions`);
  return rows;
}

function calculateMonthlySummary(transactions) {
  console.log('Calculating monthly summary...');

  const months = {};

  transactions.forEach(t => {
    const monthKey = t.date.substring(0, 7); // YYYY-MM
    if (!months[monthKey]) {
      months[monthKey] = {
        month: monthKey,
        transactionCount: 0,
        totalCash: 0,
        cashFromAds: 0,
        cashFromOrganic: 0
      };
    }

    const amount = parseFloat(t.amount) || 0;
    months[monthKey].transactionCount++;
    months[monthKey].totalCash += amount;

    if (t.attribution_source === 'PAID') {
      months[monthKey].cashFromAds += amount;
    } else {
      months[monthKey].cashFromOrganic += amount;
    }
  });

  // Sort and round
  const sorted = Object.values(months)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({
      month: m.month,
      transactionCount: m.transactionCount,
      totalCash: Math.round(m.totalCash * 100) / 100,
      cashFromAds: Math.round(m.cashFromAds * 100) / 100,
      cashFromOrganic: Math.round(m.cashFromOrganic * 100) / 100
    }));

  console.log(`  Calculated ${sorted.length} months`);
  return sorted;
}

function calculateDailyBreakdown(transactions) {
  console.log('Calculating daily breakdown...');

  const days = {};

  transactions.forEach(t => {
    const dateKey = t.date;
    if (!days[dateKey]) {
      days[dateKey] = {
        date: dateKey,
        cashFromAds: 0,
        cashFromOrganic: 0
      };
    }

    const amount = parseFloat(t.amount) || 0;
    if (t.attribution_source === 'PAID') {
      days[dateKey].cashFromAds += amount;
    } else {
      days[dateKey].cashFromOrganic += amount;
    }
  });

  // Sort and round
  const sorted = Object.values(days)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date,
      cashFromAds: Math.round(d.cashFromAds * 100) / 100,
      cashFromOrganic: Math.round(d.cashFromOrganic * 100) / 100
    }));

  console.log(`  Calculated ${sorted.length} days`);
  return sorted;
}

async function exportToGitHub(jsonData) {
  console.log('Exporting to GitHub...');

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log('  ⚠️  GITHUB_TOKEN not set. Skipping GitHub push.');
    return false;
  }

  try {
    const owner = 'jayr-ai';
    const repo = 'heart-smart-dashboard';
    const filePath = 'masterclass-dashboard/data/cash-attribution.json';
    const branch = 'main';

    // Get current file SHA
    let currentSha = null;
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (getResponse.ok) {
        const data = await getResponse.json();
        currentSha = data.sha;
      }
    } catch (e) {
      // File might not exist yet
    }

    // Create commit
    const content = Buffer.from(JSON.stringify(jsonData, null, 2)).toString('base64');
    const commitMessage = `Update Heart Smart revenue attribution data (${jsonData.meta.totalRecords} transactions, $${jsonData.meta.totalRevenue} AUD) - ${new Date().toISOString().split('T')[0]}`;

    const payload = {
      message: commitMessage,
      content: content,
      branch: branch
    };

    if (currentSha) {
      payload.sha = currentSha;
    }

    const putResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (putResponse.ok) {
      const result = await putResponse.json();
      console.log(`  ✅ Pushed to GitHub (${result.commit.sha.substring(0, 7)})`);
      return true;
    } else {
      console.log(`  ❌ GitHub push failed: ${putResponse.status}`);
      return false;
    }
  } catch (error) {
    console.error('  ❌ Error pushing to GitHub:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('Heart Smart Revenue Export');
    console.log('='.repeat(50));
    console.log('');

    // Fetch transactions
    const transactions = await fetchRevenueTransactions();
    if (!transactions || transactions.length === 0) {
      console.error('Failed to fetch transactions');
      process.exit(1);
    }

    // Calculate aggregations
    const monthlySummary = calculateMonthlySummary(transactions);
    const dailyBreakdown = calculateDailyBreakdown(transactions);

    // Transform transactions
    console.log('Transforming transactions...');
    const totalRevenue = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const transformedTransactions = transactions.map(t => ({
      date: t.date,
      name: t.name || '',
      email: t.email || '',
      product: t.product || '',
      amount: parseFloat(t.amount) || 0,
      source: t.attribution_source === 'PAID' ? 'Paid' : 'Organic'
    }));

    // Build JSON
    console.log('Building JSON export...');
    const jsonData = {
      meta: {
        generatedAt: new Date().toISOString(),
        source: 'BigQuery revenue_transactions_enriched table with Heart Smart products',
        dataWindow: 'Nov 2025 - Sep 2026',
        totalRecords: transactions.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        currency: 'AUD'
      },
      monthlySummary: monthlySummary,
      dailyBreakdown: dailyBreakdown,
      transactions: transformedTransactions
    };

    // Save locally
    const outputFile = path.join(__dirname, 'masterclass-dashboard/data/cash-attribution.json');
    console.log(`Saving to ${outputFile}...`);

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));

    const fileSize = fs.statSync(outputFile).size;
    console.log(`✅ Local export complete (${fileSize} bytes)`);

    // Try to export to GitHub
    await exportToGitHub(jsonData);

    console.log('');
    console.log('Summary:');
    console.log(`  Transactions: ${transactions.length}`);
    console.log(`  Total Revenue: $${Math.round(totalRevenue * 100) / 100} AUD`);
    console.log(`  Months: ${monthlySummary.length}`);
    console.log(`  Days: ${dailyBreakdown.length}`);
    console.log('');
    console.log('✅ Export complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
