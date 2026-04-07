import fs from 'fs';
import https from 'https';

const url = "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=1200&h=630&auto=format&fit=crop";

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

https.get(url, (res) => {
  const file = fs.createWriteStream('public/og-image.jpg');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded og-image.jpg');
  });
}).on('error', (err) => {
  console.error('Error downloading:', err.message);
});
