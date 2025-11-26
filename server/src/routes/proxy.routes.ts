import { Router } from 'express';
import proxyController from '../controllers/proxy.controller';

const router = Router();

console.log('🔄 Proxy routes initialized');

// GET /api/proxy/pdf - Proxy PDF with CORS headers
router.get('/pdf', proxyController.proxyPdf.bind(proxyController));

export default router;
