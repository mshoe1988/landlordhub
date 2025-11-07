export interface RentCollectionEmailPayload {
  landlordName?: string
  propertyAddress: string
  amount: number
  dueDate?: string
  checkoutUrl: string
  recurring?: boolean
}

export const formatCurrency = (value: number, currency: string = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)

export function buildRentCollectionEmail({
  landlordName,
  propertyAddress,
  amount,
  dueDate,
  checkoutUrl,
  recurring,
}: RentCollectionEmailPayload) {
  const readableAmount = formatCurrency(amount)
  const readableDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const subject = `Your rent for ${propertyAddress} is due — pay securely online`

  const greetingName = landlordName ? `${landlordName}` : 'your landlord'

  const headline = recurring
    ? 'Set up automatic rent payments'
    : 'Your rent is due'

  const bodyLead = recurring
    ? `You can complete your rent payment and opt into automatic payments with our secure Stripe checkout.`
    : `You can pay your rent securely online using our Stripe-powered checkout.`

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Pay Rent Online</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f5f7fa; padding: 40px 0;">
        <tr>
          <td>
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 36, 64, 0.08);">
              <tr>
                <td style="background: linear-gradient(135deg, #1C7C63, #0F5C70); padding: 32px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 28px;">${headline}</h1>
                  <p style="margin: 12px 0 0; font-size: 16px; opacity: 0.9;">Sent by ${greetingName} via LandlordHub</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px; color: #0F2A3D;">
                  <p style="margin-top: 0; font-size: 16px; line-height: 1.6;">${bodyLead}</p>
                  <div style="background-color: #f0f7f4; border: 1px solid #cde8dd; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 8px; font-weight: 600;">Property:</p>
                    <p style="margin: 0 0 16px;">${propertyAddress}</p>
                    <p style="margin: 0 0 8px; font-weight: 600;">Amount Due:</p>
                    <p style="margin: 0 0 16px; font-size: 20px; font-weight: bold; color: #1C7C63;">${readableAmount}</p>
                    ${readableDueDate ? `<p style="margin: 0 0 8px; font-weight: 600;">Due Date:</p><p style="margin: 0;">${readableDueDate}</p>` : ''}
                  </div>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${checkoutUrl}" style="background-color: #1C7C63; color: #ffffff; padding: 14px 26px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">
                      Pay Rent Now
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #4f5d66; line-height: 1.6;">
                    This checkout is powered by Stripe. Your payment is sent directly to your landlord's bank account.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f5f7fa; padding: 24px; text-align: center; font-size: 12px; color: #6c7a86;">
                  <p style="margin: 0;">Need help? Contact your landlord or email support@landlordhub.com.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`

  const text = `Pay rent for ${propertyAddress}\n\nAmount Due: ${readableAmount}${readableDueDate ? `\nDue Date: ${readableDueDate}` : ''}\n\nPay securely: ${checkoutUrl}\n\nThis checkout is powered by Stripe. Funds are deposited directly to your landlord.`

  return { subject, html, text }
}
