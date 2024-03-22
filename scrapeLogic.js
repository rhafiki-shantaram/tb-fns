const { log } = require('console');
const puppeteer = require('puppeteer');
const axios = require('axios');

const scrapeLogic = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
            "--enable-gpu",
            '--disable-features=site-per-process'
        ],
        executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto('http://oms.zoosupplychain.com/', { waitUntil: 'networkidle0' });

        // Ensuring the page is fully loaded before proceeding
        await page.waitForTimeout(5000);
        await page.waitForSelector('#userName', { visible: true });
        await page.type('#userName', 'LM607');
        await page.waitForSelector('#userPass', { visible: true });
        await page.type('#userPass', 'Tiktok666');
        await page.waitForSelector('#loginSubmit', { visible: true });

        // Click and wait for navigation to complete
        await Promise.all([
            page.waitForNavigation(),
            page.click('#loginSubmit'),
        ]);

        // Ensuring navigation has completed (2nd nav)
        await page.goto('http://oms.zoosupplychain.com/product/inventory-wms/list', { waitUntil: 'networkidle0' });

        // Interact with the page
        await page.waitForSelector('#product_barcode');
        await page.click('#product_barcode', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type('#product_barcode', " ");
        await page.keyboard.press('Enter');

        // Modify the page size and wait for any possible navigation
        await page.evaluate(() => {
            const pageSizeInput = document.querySelector('#pageSize');
            if (pageSizeInput) {
                pageSizeInput.value = '999';
                pageSizeInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Additional wait to ensure any changes have taken effect
        await page.waitForTimeout(1000);

        // Interact with the page again
        await page.waitForSelector('#product_barcode');
        await page.click('#product_barcode', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Enter');

        // Extract the data
        const stockData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('#table-module-list-data tr'));
            return rows.map(row => {
                const skuCell = row.querySelector('td:nth-child(3) a');
                const sellableCell = row.querySelector('td:nth-child(10)');
                return {
                    sku: skuCell ? skuCell.textContent.trim() : '',
                    可售: sellableCell ? sellableCell.textContent.trim() : ''
                };
            });
        });

        // Send the data
        const endpoint = 'https://trendyadventurer.wixstudio.io/tb-redo/_functions/recieveStockData_LA';
        const response = await axios.post(endpoint, stockData);
        console.log('StockData payload sent successfully:', response.data);

    } catch (error) {
        console.error(`Error: ${error}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = { scrapeLogic };
