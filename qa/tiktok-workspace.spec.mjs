import { test, expect } from '@playwright/test';

const base = 'https://noor-arief.github.io/Bima-Content-Studio/';
test.use({ locale: 'id-ID', timezoneId: 'Asia/Jakarta' });
test.beforeEach(async ({ page }) => {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#channelBar [data-channel="tiktok"]')).toBeVisible();
  await page.locator('#channelBar [data-channel="tiktok"]').click();
  await expect(page.locator('#tiktokWorkspace')).toBeVisible();
});

test('channel isolation and TikTok navigation', async ({ page }) => {
  await expect(page.locator('#ytWorkspace')).toBeHidden();
  await expect(page.locator('#shopeeWorkspace')).toBeHidden();
  const sections = ['ringkasan', 'kalender', 'desk', 'publishing'];
  for (const sec of sections) {
    await page.locator('#tiktokWorkspace [data-sec-go="'+sec+'"]').click();
    await expect(page.locator('#tiktokWorkspace')).toHaveAttribute('data-sec',sec);
    await expect(page.locator('#shopeeWorkspace')).toBeHidden();
  }
  await page.locator('#channelBar [data-channel="youtube"]').click();
  await expect(page.locator('#ytWorkspace')).toBeVisible();
  await expect(page.locator('#tiktokWorkspace')).toBeHidden();
  await page.locator('#channelBar [data-channel="tiktok"]').click();
  await expect(page.locator('#tiktokWorkspace')).toBeVisible();
});

test('draft persists after reload; zero side effects in Shopee store', async ({ page }) => {
  await page.locator('#tiktokWorkspace [data-act="new"]').first().click();
  await expect(page.locator('#aff-tiktok-form')).toBeVisible();
  await page.locator('#aff-tiktok-f-product').fill('QA SAMPLE - DO NOT PUBLISH');
  await page.locator('#aff-tiktok-f-productUrl').fill('https://www.tiktok.com/');
  await page.locator('#aff-tiktok-f-facts').fill('Temporary synthetic QA product; no claims');
  await page.locator('#aff-tiktok-form button[type="submit"]').click();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('bima-tiktok-affiliate-v1') || '{}'));
  expect(before.drafts.some(d => d.product === 'QA SAMPLE - DO NOT PUBLISH')).toBeTruthy();
  expect(await page.evaluate(() => localStorage.getItem('bima-shopee-affiliate-v1'))).toBeNull();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#channelBar [data-channel="tiktok"]').click();
  await page.locator('#tiktokWorkspace [data-sec-go="desk"]').click();
  await expect(page.locator('#aff-tiktok-f-product')).toHaveValue('QA SAMPLE - DO NOT PUBLISH');
});

test('publishing remains manual; incomplete product cannot be marked ready', async ({ page }) => {
  await page.locator('#tiktokWorkspace [data-act="new"]').first().click();
  await page.locator('#tiktokWorkspace [data-sec-go="publishing"]').click();
  await page.locator('#tiktokWorkspace [data-act="ready"]').click();
  const stage = await page.evaluate(() => {
    const d=JSON.parse(localStorage.getItem('bima-tiktok-affiliate-v1')||'{}');
    return d.drafts.find(x=>x.id===d.selected)?.stage;
  });
  expect(stage).not.toBe('Siap unggah manual');
  await expect(page.locator('#aff-tiktok-msg')).toContainText(/Lengkapi|Isi|MP4/i);
});

test('mobile TikTok sections remain usable', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.locator('#channelBar [data-channel="tiktok"]').click();
  await expect(page.locator('#tiktokWorkspace')).toBeVisible();
  for(const sec of ['ringkasan','kalender','desk','publishing']) {
    await page.locator('#tiktokWorkspace [data-sec-go="'+sec+'"]').click();
    await expect(page.locator('#tiktokWorkspace')).toHaveAttribute('data-sec',sec);
  }
});
