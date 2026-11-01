import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../tokens.css';
import '../../../packages/consent-react/styles.css';
import './gallery.css';
import { Gallery } from './Gallery.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);
