import { create as productsCreate, store as productsStore, update as productsUpdate } from '@/actions/App/Http/Controllers/ProductController';
import InputError from '@/components/input-error';
import ProductSchema from '@/components/SEO/ProductSchema';
import { TagCombobox } from '@/components/tags/TagCombobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Textarea } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

export default function ProductForm({ ...props }) {

    const { product, isView, isEdit, allTags = [] } = props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `${isView ? 'Show' : isEdit ? 'Update' : 'Create'} Product`,
            href: productsCreate().url,
        },
    ];

    // console.log('📦 Product:', product);
    const { data, setData, post, errors, processing, reset, transform } = useForm({
        name: product?.name || '',
        description: product?.description || '',
        image: null as File | null,
        price: product?.price || '',
        quantity: product?.quantity ?? 1,
        status: product?.status || 'active',
        _method: isEdit ? 'PUT' : 'POST',
        tag: product?.tag
        ? Array.isArray(product.tag) 
            ? product.tag 
            : product.tag.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '')
        : [],
        tagInput: '',
        availableTags: allTags,
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // console.log('📦 Submitting form with data:', data);

        const url = isEdit ? productsUpdate(product.id).url : productsStore().url;

        transform((data) => {
            if (isEdit && data.image === null) {
                const { image, ...rest } = data;
                void image; // Kept out of the payload when no replacement file was chosen.
                return rest;
            }
            // console.log('📦 Transformed data:', data);
            return data;
        });

        post(url, {
            forceFormData: true,
            onSuccess: () => reset(),
            onError: (error) => console.error('📦 Error submitting form:', error),
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setData('image', e.target.files[0]);
        }
    };  

    // console.log('Type of tag:', typeof data.tag);
    // console.log('Value of tag:', data.tag);
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head>
                <title>Product Form</title>
                <meta name="description" content="Create or update a product" />
            </Head>

            <ProductSchema product={product} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                <Card>
                    <CardHeader>
                        <CardTitle>{isView ? 'Show' : isEdit ? 'Update' : 'Create'} Product</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4" autoComplete="off">
                            <div className="col-span-6 sm:col-span-4">
                                <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Name
                                </Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    type="text"
                                    name="name"
                                    id="name"
                                    disabled={isView || processing}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />

                                <InputError message={errors.name} />
                            </div>
                            <div className="col-span-6 sm:col-span-4">
                                <Label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    cols={80}
                                    name="description"
                                    id="description"
                                    disabled={isView || processing}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="col-span-6 sm:col-span-4">
                                <Label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                    Price
                                </Label>
                                <Input
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    type="text"
                                    name="price"
                                    id="price"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    disabled={isView || processing}
                                />
                                <InputError message={errors.price} />
                            </div>

                            <div className="col-span-6 sm:col-span-4">
                                <Label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                                    Quantity in Stock
                                </Label>
                                <Input
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', e.target.value)}
                                    type="number"
                                    min="0"
                                    step="1"
                                    name="quantity"
                                    id="quantity"
                                    disabled={isView || processing}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <InputError message={errors.quantity} />
                            </div>

                            <div className="col-span-6 sm:col-span-4">
                                <Label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                    Status
                                </Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) => setData('status', value)}
                                    disabled={isView || processing}
                                >
                                    <SelectTrigger id="status" className="mt-1 w-full">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                            
                            <div className="col-span-6 sm:col-span-4">                                
                                <TagCombobox
                                    initialTags={data.tag || []}
                                    availableTags={allTags || []}
                                    onTagsChange={(newTags) => setData('tag', newTags)}
                                    isViewMode={isView}
                                    isSubmitting={processing}
                                    maxTags={20}
                                />                                
                            </div>

                            {!isView && (
                                <div className="col-span-6 sm:col-span-4">
                                    <Label htmlFor="Image" className="block text-sm font-medium text-gray-700">
                                        Image
                                    </Label>
                                    <Input
                                        onChange={handleFileUpload}
                                        type="file"
                                        name="image"
                                        id="image"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        autoFocus
                                        tabIndex={4}
                                    />
                                    <InputError message={errors.image} />
                                </div>
                            )}

                            {(isView || isEdit) && (
                                <div className="col-span-6 sm:col-span-4">
                                    <Label htmlFor="Image" className="block text-sm font-medium text-gray-700">
                                        Current Image
                                    </Label>
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className='rounded object-cover'
                                        width={100}
                                        height={100}
                                        loading='lazy'
                                    />
                                </div>
                            )}

                            {!isView && (
                                <div className="col-span-6 sm:col-span-4">
                                    <Button
                                        type="submit"
                                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    >
                                        {processing && <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />}
                                        {processing ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update Product' : 'Create Product'}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
