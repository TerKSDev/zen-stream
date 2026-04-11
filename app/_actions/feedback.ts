'use server';

export async function sendFeedback(data: { type: string; message: string; url?: string }) {
   const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

   if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL is not configured.');
      return { success: false, error: 'Configuration error' };
   }

   // 依據不同的 Feedback 類型設定 Discord Embed 的顏色
   const colors: Record<string, number> = {
      Bug: 0xFF5252,        // 紅色
      Suggestion: 0xA07CFE, // Zen Stream 亮紫色
      Question: 0x448AFF,   // 藍色
   };

   const payload = {
      username: 'ZenStream Feedback',
      avatar_url: 'https://i.imgur.com/AfFp7pu.png', // 可替換為專案 Logo 網址
      embeds: [
         {
            title: `New ${data.type}`,
            description: data.message,
            color: colors[data.type] || 0xA07CFE,
            timestamp: new Date().toISOString(),
            fields: data.url ? [{ name: 'Page URL', value: data.url }] : [],
         },
      ],
   };

   try {
      const res = await fetch(webhookUrl, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Discord API Error');
      return { success: true };
   } catch (error) {
      return { success: false, error: 'Failed to send feedback' };
   }
}
