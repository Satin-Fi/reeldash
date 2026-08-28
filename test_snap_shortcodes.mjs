import { resolveViaSnapSave } from './src/lib/instagram.js';

async function testSnapSaveShortcodes() {
  const shortcodes = ['DFdK-b2vC-y', 'DFf8J9fv6-L', 'DFf1s3xvQvX', 'DbZkDwZsHgd'];
  for (const code of shortcodes) {
    console.log(`\n=== Testing shortcode: ${code} ===`);
    try {
      const res = await resolveViaSnapSave(`https://www.instagram.com/p/${code}/`);
      console.log('Result:', JSON.stringify(res, null, 2));
    } catch (e) {
      console.error('Error:', e);
    }
  }
}

testSnapSaveShortcodes();
