import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function DashboardPage() {
    const [repoName, setRepoName] = useState('');
    const [siteUrl, setSiteUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [subscription, setSubscription] = useState<any>(null);

    useEffect(() => {
        // Check subscription status on load
        const checkSubscription = async () => {
            try {
                const params = new URLSearchParams({ userId: sessionStorage.getItem('userId') || '' });
                const response = await fetch(`/api/subscription/status?${params}`);
                const data = await response.json();
                setSubscription(data);
            } catch (err) {
                console.error('Error checking subscription:', err);
                setError('Failed to verify subscription status');
            }
        };

        checkSubscription();
    }, []);

    const handleCreateSite = async () => {
        if (!repoName) {
            setError('Please enter a repository name');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const userId = sessionStorage.getItem('userId');
            const response = await fetch('/api/github-site/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId,
                    repoName 
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSiteUrl(data.pagesUrl);
            } else {
                setError(data.error || 'Failed to create site');
            }
        } catch (err) {
            setError('Failed to create site');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create Static Site</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {!subscription?.isSubscribed && (
                            <Alert>
                                <AlertDescription>
                                    You need an active subscription to create static sites.
                                    <Button variant="link" className="pl-2" onClick={() => window.location.href = '/pricing'}>
                                        Upgrade now
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-4">
                            <Input
                                placeholder="Enter repository name"
                                value={repoName}
                                onChange={(e) => setRepoName(e.target.value)}
                                disabled={!subscription?.isSubscribed}
                            />
                            <Button 
                                onClick={handleCreateSite}
                                disabled={isLoading || !subscription?.isSubscribed}
                            >
                                {isLoading ? 'Creating...' : 'Create Site'}
                            </Button>
                        </div>

                        {error && (
                            <div className="text-red-500">{error}</div>
                        )}

                        {siteUrl && (
                            <div className="space-y-4">
                                <div className="text-sm text-gray-500">
                                    Your site is live at: <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{siteUrl}</a>
                                </div>
                                <div className="aspect-video w-full border rounded-lg overflow-hidden">
                                    <iframe
                                        src={siteUrl}
                                        className="w-full h-full"
                                        title="Site Preview"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}