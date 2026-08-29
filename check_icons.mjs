import * as Lucide from 'lucide-react';

const candidateIcons = ['Images', 'GalleryHorizontal', 'GalleryHorizontalEnd', 'SquareStack', 'Copy', 'Layers', 'Grid', 'LayoutGrid'];
for (const icon of candidateIcons) {
  console.log(icon, 'exists:', !!Lucide[icon]);
}
