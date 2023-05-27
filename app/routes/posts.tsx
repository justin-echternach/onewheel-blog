import { Outlet, isRouteErrorResponse, useParams, useRouteError } from '@remix-run/react';

export default function PostsRoute() {
    return (<Outlet />);
}
export function ErrorBoundary() {
    const error: Error = useRouteError() as Error;
    
    return <div className="text-red-500">
        Oh no, something went wrong!
        <pre>{error.message}</pre>
    </div>
    
}