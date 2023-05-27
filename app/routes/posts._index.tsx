import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { getPostListings } from "~/models/post.server";
import { useOptionalAdminUser, useOptionalUser } from "~/utils";

type LoaderData = {
    posts: Awaited<ReturnType<typeof getPostListings>>;
}

export const loader: LoaderFunction = async () => {
    const posts = await getPostListings();
    
    return json<LoaderData>({ posts });
    // const postsString = JSON.stringify({posts});
    // return new Response(postsString, {
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    // })
}

export default function PostsRoute() {
    const { posts } = useLoaderData() as LoaderData;
    const adminuser = useOptionalAdminUser();

    return (
        <main>
            <h1>Posts</h1>
            {adminuser ? (<Link to="admin" className="text-red-600 underline">
                Admin
            </Link>) : null}
            <ul>
                {posts.map((post) => (
                    <li key={post.slug}>
                        <Link to={post.slug} prefetch="intent" className="text-blue-600 underline">
                            {post.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    )
}