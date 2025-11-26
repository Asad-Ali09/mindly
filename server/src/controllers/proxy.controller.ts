import { Request, Response } from 'express';
import axios from 'axios';

class ProxyController {
  /**
   * Proxy PDF from Cloudinary with proper CORS headers
   */
  proxyPdf = async (req: Request, res: Response) => {
    try {
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'URL parameter is required'
        });
      }

      // Fetch the PDF from Cloudinary
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Set proper headers for PDF viewing in iframe
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // Send the PDF
      res.send(Buffer.from(response.data));
    } catch (error) {
      console.error('Error proxying PDF:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to load PDF'
      });
    }
  };
}

export default new ProxyController();
