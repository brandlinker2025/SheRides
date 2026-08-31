const SMS_URL = "https://api.sms.net.bd/sendsms";

type SmsNetBdResponse = {
  error?: number | string;
  msg?: string;
};

export function smsNetBdConfigured(): boolean {
  return Boolean(process.env.SMS_NET_BD_API_KEY?.trim());
}

export async function sendSmsNetBd(to: string, msg: string): Promise<string | null> {
  const apiKey = process.env.SMS_NET_BD_API_KEY?.trim();
  if (!apiKey) {
    return "SMS is not configured on this server. Add SMS_NET_BD_API_KEY to send verification codes.";
  }

  const body = new URLSearchParams();
  body.set("api_key", apiKey);
  body.set("msg", msg);
  body.set("to", to);

  let response: Response;
  try {
    response = await fetch(SMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
  } catch {
    return "Could not reach the SMS provider. Please try again.";
  }

  let payload: SmsNetBdResponse = {};
  try {
    payload = (await response.json()) as SmsNetBdResponse;
  } catch {
    if (!response.ok) return "The SMS provider rejected the request.";
  }

  const errorCode = payload.error;
  const ok = errorCode === 0 || errorCode === "0";
  if (ok) return null;

  const providerMsg = typeof payload.msg === "string" ? payload.msg.trim() : "";
  if (providerMsg) return providerMsg;
  if (!response.ok) return "The SMS provider rejected the request.";
  return "The SMS was not sent.";
}

export function memberOtpMessage(code: string): string {
  return `Your SheRides code is ${code}. It expires in 10 minutes.`;
}
