interface ProductSchemaProduct {
    name?: string;
    description?: string;
    image?: string | null;
    slug?: string;
    price?: number | string;
    quantity?: number | string;
    status?: 'active' | 'draft' | 'archived';
}

export default function ProductSchema({
    product,
}: {
    product?: ProductSchemaProduct | null;
}) {
    if (!product) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    name: product.name,
                    description: product.description,
                    image: product.image,
                    sku: product.slug,
                    offers: {
                        '@type': 'Offer',
                        priceCurrency: 'USD',
                        price: product.price,
                        availability:
                            product.status === 'active' &&
                            Number(product.quantity) > 0
                                ? 'https://schema.org/InStock'
                                : product.status === 'archived'
                                  ? 'https://schema.org/Discontinued'
                                  : 'https://schema.org/OutOfStock',
                    },
                }),
            }}
        />
    );
}
