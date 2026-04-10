import { NextResponse } from 'next/server';

// 這裡我們暫時用一個全域變數存最新的網址 (實際專案可以存入 Database 或 Redis)
let latestCapturedData: any = null;

export async function POST(req: Request) {
   try {
      const body = await req.json();
      console.log('📥 收到來自 TamperMonkey 的影片資料:', body);

      // 將資料保存下來
      latestCapturedData = body;

      return NextResponse.json({ success: true, message: '接收成功' });
   } catch (error) {
      return NextResponse.json({ success: false }, { status: 500 });
   }
}

// 讓你的前端可以輪詢這個 API 來獲取最新抓到的網址
export async function GET() {
   return NextResponse.json({ data: latestCapturedData });
}
