import { Product } from '../models/Product.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      collection,
      isFeatured,
      search,
      minPrice,
      maxPrice,
      sort,
      limit = 50,
      page = 1
    } = req.query;

    const query = { isActive: true };

    if (category && category !== 'all' && category !== 'All Decor') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (collection && collection !== 'all') {
      query.collection = collection;
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { material: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { collectionName: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'price-asc') sortOptions = { price: 1 };
    else if (sort === 'price-desc') sortOptions = { price: -1 };
    else if (sort === 'name-asc') sortOptions = { name: 1 };
    else if (sort === 'featured') sortOptions = { isFeatured: -1, createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      products
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug: slug.toLowerCase(), isActive: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'The requested heirloom piece could not be found in our atelier collection.'
      });
    }

    // Find related pieces from the same collection or category
    const related = await Product.find({
      _id: { $ne: product._id },
      $or: [
        { collection: product.collection },
        { category: product.category }
      ],
      isActive: true
    })
      .limit(4)
      .select('name slug price compareAtPrice dimensions material images thumbnail collection collectionName badge');

    res.status(200).json({
      success: true,
      product,
      related
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }
    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (req, res, next) => {
  try {
    const queryStr = req.query.q || '';
    if (!queryStr.trim()) {
      return res.status(200).json({
        success: true,
        results: []
      });
    }

    const regex = new RegExp(queryStr.trim(), 'i');
    const results = await Product.find({
      isActive: true,
      $or: [
        { name: regex },
        { category: regex },
        { collectionName: regex },
        { material: regex },
        { description: regex }
      ]
    })
      .limit(10)
      .select('name slug price dimensions material images thumbnail collection collectionName category badge');

    res.status(200).json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    next(error);
  }
};

export const getCollections = async (req, res, next) => {
  try {
    const collections = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$collection',
          collectionName: { $first: '$collectionName' },
          count: { $sum: 1 },
          sampleImage: { $first: '$thumbnail' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      collections: collections.map(c => ({
        id: c._id,
        name: c.collectionName || c._id,
        count: c.count,
        image: c.sampleImage
      }))
    });
  } catch (error) {
    next(error);
  }
};

// Admin controllers
export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
