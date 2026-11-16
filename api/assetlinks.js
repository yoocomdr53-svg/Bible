// Vercel Serverless Function: Android Digital Asset Links Endpoint
// Required by Android TWA (Trusted Web Activity) to verify com.superbible.app ownership
// Once verified, Android removes the top Chrome Custom Tab URL bar (X, URL, share, 3-dots) completely!

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  
  res.status(200).json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.superbible.app',
        sha256_cert_fingerprints: [
          '09:64:C0:16:76:88:52:93:AF:CC:57:79:1E:55:57:50:3D:26:BB:43:6C:3B:BE:CA:EF:94:23:74:39:44:8E:F6'
        ]
      }
    }
  ]);
}
