import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

export default function Pricing() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">IronStamp Pricing</h1>
                    <p>Tailored for HVAC SMBs with SMS usage in mind.</p>
                </div>

                <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-medium">Starter</CardTitle>
                            <span className="my-3 block text-2xl font-semibold">$39 / mo</span>
                            <CardDescription className="text-sm">For small HVAC teams or solo techs managing a handful of certs.</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {['Up to 50 active certifications', 'Unlimited team members', 'SMS & email reminders', 'Full certification tracking', 'PDF compliance reports', 'Standard support'].map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2">
                                        <Check className="size-3" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>

                        <CardFooter className="mt-auto">
                            <Button
                                asChild
                                variant="outline"
                                className="w-full">
                                <Link href="">Get Started</Link>
                            </Button>
                        </CardFooter>
                        <div className="px-6 pb-6 text-center">
                            <p className="text-xs text-muted-foreground">Perfect for 1–5 techs</p>
                        </div>
                    </Card>

                    <Card className="relative">
                        <span className="bg-gradient-to-br absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-blue-500 to-purple-500 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">Popular</span>

                        <div className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-medium">Standard</CardTitle>
                                <span className="my-3 block text-2xl font-semibold">$99 / mo</span>
                                <CardDescription className="text-sm">Best for growing HVAC businesses that need reliable cert compliance at scale.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <hr className="border-dashed" />
                                <ul className="list-outside space-y-3 text-sm">
                                    {['Up to 150 active certifications', 'Unlimited team members', 'SMS & email reminders', 'Full certification tracking', 'PDF compliance reports', 'Priority support'].map((item, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-2">
                                            <Check className="size-3" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    asChild
                                    className="w-full">
                                    <Link href="">Get Started</Link>
                                </Button>
                            </CardFooter>
                            <div className="px-6 pb-6 text-center">
                                <p className="text-xs text-muted-foreground">Ideal for 6–15 techs</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-medium">Pro</CardTitle>
                            <span className="my-3 block text-2xl font-semibold">$179 / mo</span>
                            <CardDescription className="text-sm">For large teams that need high-volume tracking without missing a beat.</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {['Up to 300 active certifications', 'Unlimited team members', 'SMS & email reminders', 'Full certification tracking', 'PDF compliance reports', 'Priority support'].map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2">
                                        <Check className="size-3" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>

                        <CardFooter className="mt-auto">
                            <Button
                                asChild
                                variant="outline"
                                className="w-full">
                                <Link href="">Get Started</Link>
                            </Button>
                        </CardFooter>
                        <div className="px-6 pb-6 text-center">
                            <p className="text-xs text-muted-foreground">Built for 15–30 techs</p>
                        </div>
                    </Card>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Want to scale beyond 300 certifications? We&apos;ll grow with you.{' '}
                        <a href="mailto:ironstamp.team@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium underline">
                            Contact
                        </a>{' '}
                        us when ready.
                    </p>
                </div>
            </div>
        </section>
    )
} 