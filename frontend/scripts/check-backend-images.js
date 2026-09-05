const fs = require('fs');

async function checkBackend() {
  try {
    const res1 = await fetch('https://kharridlo-backend.onrender.com/api/v1/marketplace/search?page=1&page_size=50');
    const data1 = await res1.json();
    const res2 = await fetch('https://kharridlo-backend.onrender.com/api/v1/marketplace/search?page=2&page_size=50');
    const data2 = await res2.json();
    const allItems = [...(data1.items || []), ...(data2.items || [])];
    console.log(`Fetched ${allItems.length} total items from backend`);
    
    const missing = [];
    const imageCount = {};

    allItems.forEach((item, idx) => {
      const img = item.primary_image_url || (item.images && item.images[0] && item.images[0].source_url) || '';
      console.log(`[${idx+1}] ID: ${item.id} | Category: ${item.category} | Title: "${item.title.substring(0, 40)}" | Image: ${img}`);
      
      if (!img || img.trim() === '' || img === '/assets/laptop-product.png') {
        missing.push({ id: item.id, title: item.title, category: item.category, provider: item.provider, img });
      }
      imageCount[img] = (imageCount[img] || 0) + 1;
    });

    console.log('\n--- DUPLICATES IN BACKEND ---');
    for (const [img, count] of Object.entries(imageCount)) {
      if (count > 1) {
        console.log(`Duplicate (${count}x): ${img}`);
      }
    }

    console.log('\n--- MISSING/EMPTY IN BACKEND ---');
    console.log(`Total missing: ${missing.length}`);
    missing.forEach(m => console.log(m));

    fs.writeFileSync('./scripts/backend_items.json', JSON.stringify(data.items, null, 2));
  } catch (err) {
    console.error('Error checking backend:', err);
  }
}

checkBackend();
