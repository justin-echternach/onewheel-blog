import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { Link, Outlet, isRouteErrorResponse, useLoaderData, useParams, useRouteError } from "@remix-run/react";
import { getPostListings } from "~/models/post.server";
import { requireAdminUser } from "~/session.server";

type LoaderData = {
    posts: Awaited<ReturnType<typeof getPostListings>>;
}

export const loader: LoaderFunction = async ({request}) => {
    await requireAdminUser(request);
    return json<LoaderData>({ posts: await getPostListings() });
}
export default function AdminRoute() {
    const { posts } = useLoaderData() as LoaderData;
    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="my-6 border-b-2 text-center text-3xl">Blog Admin</h1>
            <div className="grid grid-cols-4 gap-6">
                <nav className="col-span-4 md:col-span-1">
                    <ul>
                        {posts.map((post) => (
                            <li key={post.slug}>
                                <Link to={post.slug} className="text-blue-600 underline">
                                    {post.title}
                                </Link>
                            </li>
                        ))}
                    </ul>

                </nav>
                <main className="col-span-4 md:col-span-3">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export function ErrorBoundary() {
    // Remember to make sure your error boundary doesn't throw errors itself!
    const error: Error = useRouteError() as Error;
    const params = useParams();
    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            return <div>Post Not Found - {params.slug} </div>
        }
        throw new Error(`Unsupported status code: ${error.status}`);
    }
    else
    {
        return <div className="text-red-500">
            Oh no, something went wrong!
            <pre>{error.message}</pre>
        </div>
    }
}