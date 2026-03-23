import Head from 'next/head'
import { getServerSession } from "next-auth";
import { redirect } from 'next/navigation'
import { authOptions } from "@repo/lib/auth";


export default async function Home() {
  return (
    <>
      <Head>
        <title>GAN Fashion Design Generator</title>
        <meta name="description" content="Generate unique fashion designs with AI-powered Generative Adversarial Networks" />
        <meta name="keywords" content="fashion design, AI, GAN, machine learning, clothing design, artificial intelligence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="/" />
      </Head>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-16" id="fashion-generator">
            Gesture AI Hand Recognition
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Gesture AI Hand Recognition - OpenCV
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
