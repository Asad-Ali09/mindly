'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Mic, Sparkles, Zap } from 'lucide-react'
import { ReactNode } from 'react'

export function Features() {
    return (
        <div className="@container grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 *:text-center">
            <Card className="group bg-[#0A0B09] border-[#bf3a0d]/40 shadow-lg hover:shadow-[#bf3a0d]/20 transition-all duration-300">
                <CardHeader className="pb-3">
                    <CardDecorator>
                        <Zap className="size-6 text-[#bf3a0d]" aria-hidden />
                    </CardDecorator>
                    <h3 className="mt-6 font-medium text-[#fafafa]">Adaptive Learning</h3>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-[#fafafa]/70">
                        Our AI analyzes your progress and adjusts the difficulty in real-time, ensuring optimal learning pace
                    </p>
                </CardContent>
            </Card>

            <Card className="group bg-[#0A0B09] border-[#bf3a0d]/40 shadow-lg hover:shadow-[#bf3a0d]/20 transition-all duration-300">
                <CardHeader className="pb-3">
                    <CardDecorator>
                        <Mic className="size-6 text-[#bf3a0d]" aria-hidden />
                    </CardDecorator>
                    <h3 className="mt-6 font-medium text-[#fafafa]">Voice Interaction</h3>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-[#fafafa]/70">
                        Speak naturally and receive instant feedback with our advanced speech recognition technology
                    </p>
                </CardContent>
            </Card>

            <Card className="group bg-[#0A0B09] border-[#bf3a0d]/40 shadow-lg hover:shadow-[#bf3a0d]/20 transition-all duration-300">
                <CardHeader className="pb-3">
                    <CardDecorator>
                        <Sparkles className="size-6 text-[#bf3a0d]" aria-hidden />
                    </CardDecorator>
                    <h3 className="mt-6 font-medium text-[#fafafa]">AI-Powered Insights</h3>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-[#fafafa]/70">
                        Get personalized recommendations and insights to accelerate your learning journey
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div aria-hidden className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#bf3a0d_1px,transparent_1px),linear-gradient(to_bottom,#bf3a0d_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"/>
        <div className="bg-[#0A0B09] absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l border-[#bf3a0d]/40">{children}</div>
    </div>
)
