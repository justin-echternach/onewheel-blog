import { Form, useActionData, useCatch, useLoaderData, useParams, useTransition } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createPost, deletePost, getPost, updatePost, Post } from "~/models/post.server";
import invariant from "tiny-invariant";
import { requireAdminUser } from "~/session.server";
import {
    useRouteError,
    isRouteErrorResponse,
} from "@remix-run/react";

type LoaderData = { post?: Post };

export const loader: LoaderFunction = async ({ request, params }) => {
    await requireAdminUser(request);
    invariant(params.slug, "Slug is required");
    if (params.slug === 'new') {
        return json<LoaderData>({});
    }
    const post = await getPost(params.slug)
    if (!post) {
        throw new Response("Not Found", { status: 404 });
    }
    return json<LoaderData>({ post });
};

type ActionData = {
    title: null | string;
    slug: null | string;
    markdown: null | string;
} | undefined;

export const action: ActionFunction = async ({ request, params }) => {
    await requireAdminUser(request);
    invariant(params.slug, "Slug is required");
    const formData = await request.formData();
    const intent = formData.get("intent");
    if (intent === 'delete') {
        await deletePost(params.slug);
        return redirect("/posts/admin");
    }
    const title = formData.get("title");
    const slug = formData.get("slug");
    const markdown = formData.get("markdown");

    const errors: ActionData = {
        title: !title ? "Title is required" : null,
        slug: !slug ? "Slug is required" : null,
        markdown: !markdown ? "Markdown is required" : null,
    }

    const hasErrors = Object.values(errors).some(errorMessage => errorMessage);
    if (hasErrors) {
        return json<ActionData>(errors);
    }

    invariant(typeof title === "string", "Title must be a string");
    invariant(typeof slug === "string", "Slug must be a string");
    invariant(typeof markdown === "string", "Markdown must be a string");

    if (params.slug === 'new') {
        await createPost({ title, slug, markdown });
    }
    else {
        await updatePost(slug, { title, slug, markdown });
    }

    return redirect("/posts/admin");
};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-4`;

export default function NewPostRoute() {
    const data = useLoaderData() as LoaderData;
    const errors = useActionData() as ActionData;

    const transition = useTransition();
    const isCreating = transition.submission?.formData.get('intent') === 'create';
    const isNewPost = !data.post;
    const isUpdating = transition.submission?.formData.get('intent') === 'update';
    const isDeleting = transition.submission?.formData.get('intent') === 'delete';

    console.log(process.env);

    return (
        <Form method="post" key={data.post?.slug ?? 'new'}>
            <p>
                <label>
                    Post Title: {errors?.title ? (
                        <em className="text-red-500">{errors.title}</em>
                    ) : null}
                    <input type="text" name="title" className={inputClassName} defaultValue={data.post?.title} />
                </label>
            </p>
            <p>
                <label>
                    Post Slug: {errors?.slug ? (
                        <em className="text-red-500">{errors.slug}</em>
                    ) : null}
                    <input type="text" name="slug" className={inputClassName} defaultValue={data.post?.slug} />
                </label>
            </p>
            <p>
                <label htmlFor="markdown">Markdown: {errors?.markdown ? (
                    <em className="text-red-500">{errors.markdown}</em>
                ) : null}</label>
                <textarea
                    name="markdown"
                    id="markdown"
                    className={`${inputClassName} font-mono`}
                    defaultValue={data.post?.markdown}
                />
            </p>
            <div className="flex justify-end gap-4">
                {isNewPost ? null :
                    <button
                        type="submit"
                        name="intent"
                        value="delete"
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting ...' : 'Delete'}
                    </button>
                }
                <button
                    type="submit"
                    name="intent"
                    value={isNewPost ? 'create' : 'update'}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    disabled={isCreating || isUpdating}
                >
                    {isNewPost ? (isCreating ? 'Creating ...' : 'Create Post') : null}
                    {isNewPost ? null : isUpdating ? 'Updating ...' : 'Update'}
                </button>
            </div>
        </Form>
    )
}

export function CatchBoundary() {
    const caught = useCatch();
    const params = useParams();
    if (caught.status === 404) {
        return <div>Post Not Found - {params.slug} </div>
    }
    throw new Error(`Unsuported status code: ${caught.status}`);
}

export function ErrorBoundary() {
    const error: Error = useRouteError() as Error;
    const params = useParams();
    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            return <div>Post Not Found - {params.slug} </div>
        }
        throw new Error(`Unsuported status code: ${error.status}`);
    }    
}