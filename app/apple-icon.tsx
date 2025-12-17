import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
    width: 180,
    height: 180,
}
export const contentType = 'image/png'

export default async function AppleTouchIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'white',
                }}
            >
                <img
                    src={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/NEXA-LOGO-ONLY.png`}
                    alt="Nexa"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    )
}
