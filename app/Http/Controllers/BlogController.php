<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class BlogController extends Controller
{
    private $apiUrl = 'https://www.cvhowlader.com/wp-json/wp/v2';

    public function index()
    {
        try {
            $response = Http::get("{$this->apiUrl}/posts", [
                '_embed' => true,
                'per_page' => 10,
            ]);

            $posts = $response->json();

            // Transform WordPress response for the frontend
            $formattedPosts = array_map(function ($post) {
                return [
                    'id' => $post['id'],
                    'title' => $post['title']['rendered'],
                    'excerpt' => $post['excerpt']['rendered'],
                    'date' => date('M d, Y', strtotime($post['date'])),
                    'slug' => $post['slug'],
                    'featured_image' => $post['_embedded']['wp:featuredmedia'][0]['source_url'] ?? null,
                ];
            }, $posts);

            return Inertia::render('blog/index', [
                'posts' => $formattedPosts,
            ]);
        } catch (\Exception $e) {
            return Inertia::render('blog/index', [
                'posts' => [],
                'error' => 'Failed to fetch blog posts.',
            ]);
        }
    }

    public function show($slug)
    {
        try {
            $response = Http::get("{$this->apiUrl}/posts", [
                'slug' => $slug,
                '_embed' => true,
            ]);

            $post = $response->json()[0] ?? null;

            if (! $post) {
                abort(404);
            }

            $formattedPost = [
                'id' => $post['id'],
                'title' => $post['title']['rendered'],
                'content' => $post['content']['rendered'],
                'date' => date('M d, Y', strtotime($post['date'])),
                'featured_image' => $post['_embedded']['wp:featuredmedia'][0]['source_url'] ?? null,
            ];

            return Inertia::render('blog/show', [
                'post' => $formattedPost,
            ]);
        } catch (\Exception $e) {
            abort(500, 'Error fetching post content');
        }
    }
}
