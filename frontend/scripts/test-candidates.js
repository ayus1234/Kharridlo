const https = require('https');

const testIds = [
  'photo-1587829741301-dc798b83add3',
  'photo-1595225476474-87563907a212',
  'photo-1560762484-813fc97650a0',
  'photo-1511467687858-23d96c32e4ae',
  'photo-1601445638532-3c6f6c3aa1d6',
  'photo-1587202372775-e229f172b9d7',
  'photo-1618384887929-16ec33fab9ef',
  'photo-1595044426077-d36d9236d54a',
  'photo-1527864550417-7fd91fc51a46',
  'photo-1586864387967-d02ef85d93e8',
  'photo-1596207891396-373180295846',
  'photo-1626218174358-7769486c4b79',
  'photo-1584438784894-089d6a62b8fa',
  'photo-1629429408209-1f912961dbd8',
  'photo-1627843563095-f6e94676cfe0',
  'photo-1625842268584-8f3296236761',
  'photo-1588508065123-287b28e013da',
  'photo-1607604276583-eef5d076aa5f',
  'photo-1527443224154-c4a3942d3acf',
  'photo-1585792180666-f7347c490ee2',
  'photo-1547082299-de196ea013d6',
  'photo-1551645120-d70bfe84c826',
  'photo-1593640408182-31c70c8268f5',
  'photo-1542751371-adc38448a05e',
  'photo-1545665277-5937489579f2',
  'photo-1586210579191-33b45e38fa2c',
  'photo-1516321497487-e288fb19713f',
  'photo-1526738549149-8e07eca6c147',
  'photo-1586953208448-b95a79798f07',
  'photo-1561154464-82e9adf32764',
  'photo-1589739900243-4b52cd9b104e',
  'photo-1544716278-ca5e3f4abd8c',
  'photo-1512499617640-c74ae3a79d37',
  'photo-1542751110-97427bbecf20',
  'photo-1527690789675-4ea7d8da4eb3',
  'photo-1585338107529-13afc5f02586',
  'photo-1620799140408-edc6dcb6d633',
  'photo-1583863788434-e58a36330cf0',
  'photo-1584308666744-24d5c474f2ae',
  'photo-1563770660941-20978e870e26',
  'photo-1544816155-12df9643f363',
  'photo-1507473885765-e6ed057f782c',
  'photo-1544652478-6653e09f18a2',
  'photo-1597872200969-2b65d56bd16b'
];

console.log('Testing', testIds.length, 'IDs');
let working = 0;
let failed = 0;

function checkOne(id) {
  return new Promise((resolve) => {
    https.get(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=80`, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, r2 => {
          if (r2.statusCode === 200) {
            working++;
            resolve(id);
          } else {
            console.log('FAIL:', id, r2.statusCode);
            failed++;
            resolve(null);
          }
        });
      } else if (res.statusCode === 200) {
        working++;
        resolve(id);
      } else {
        console.log('FAIL:', id, res.statusCode);
        failed++;
        resolve(null);
      }
    }).on('error', e => {
      console.log('ERROR:', id, e.message);
      failed++;
      resolve(null);
    });
  });
}

Promise.all(testIds.map(checkOne)).then(() => {
  console.log(`Summary: ${working} working, ${failed} failed`);
});
