import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Try to set a desktop resolution
  await page.setViewport({ width: 1200, height: 800 });
  
  console.log('Navigating to http://localhost:5173...');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
  } catch (err) {
    console.log('Timeout or error during navigation. Proceeding to screenshot anyway...');
  }
  
  // Wait a bit for animations
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('Clicking initialize button...');
  try {
    await page.click('.btn-initialize');
  } catch (e) {
    console.log('Failed to click button:', e.message);
  }

  // Wait a bit for transiton to complete
  await new Promise(resolve => setTimeout(resolve, 2500));

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'screenshot.png' });
  
  await browser.close();
  console.log('Done!');
})();
