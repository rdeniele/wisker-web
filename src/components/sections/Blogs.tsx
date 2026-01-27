"use client";
import React from "react";
import Image from "next/image";

const blogPosts = [
	{
		id: 1,
		image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80",
		title: "How Wisker Works",
		description: "Discover the features and benefits of using Wisker for your business.",
		url: "/blog/how-wisker-works"
	},
	{
		id: 2,
		image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80",
		title: "Getting Started",
		description: "A quick guide to help you get started with Wisker in minutes.",
		url: "/blog/getting-started"
	},
	{
		id: 3,
		image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
		title: "Customer Success Stories",
		description: "Read how our customers are achieving success with Wisker.",
		url: "/blog/customer-success-stories"
	}
];

const Blogs = () => {
	return (
		<section className="py-12 bg-[#f5faff]" id="blogs">
			<h2 className="text-3xl font-extrabold text-center mb-10 text-[#4a90e2] tracking-tight">Latest Blogs</h2>
			<div className="flex flex-wrap justify-center gap-10">
				{blogPosts.map(post => (
					<div
						key={post.id}
						className="transition-transform duration-150 cursor-pointer flex flex-col items-center rounded-3xl border-4 px-0 py-0 min-w-[220px] max-w-[320px] w-[300px] bg-white"
						style={{ borderColor: '#5c5c5c', boxShadow: '12px 12px 0 #5c5c5c, 0 4px 24px rgba(0,0,0,0.10)' }}
						onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
						onMouseLeave={e => (e.currentTarget.style.transform = '')}
					>
						<div className="relative w-full h-[180px] rounded-t-3xl overflow-hidden">
							<Image
								src={post.image}
								alt={post.title}
								fill
								className="object-cover w-full h-full"
							/>
							<div className="absolute bottom-0 left-0 w-full bg-black/50 px-4 py-2">
								<h3 className="font-bold text-lg text-white text-center m-0">{post.title}</h3>
							</div>
						</div>
						<div className="flex flex-col items-center px-8 py-6 w-full">
							<p className="text-gray-700 text-base text-center mb-4 w-full">{post.description}</p>
							<a
								href={post.url}
								className="font-bold text-[#4a90e2] hover:underline hover:text-[#171717] transition-colors duration-150"
							>
								Read Full Blog
							</a>
						</div>
					</div>
				))}
			</div>
		</section>
	);
};
							
							export default Blogs;
