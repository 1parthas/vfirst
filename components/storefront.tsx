"use client";

import {
  Check,
  ChevronRight,
  Globe2,
  Heart,
  Leaf,
  Lock,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Truck,
  User,
  X
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type SyntheticEvent
} from "react";
import {
  type VFirstPagination,
  type VFirstProduct,
  type VFirstSku
} from "@/lib/vfirst-api";

type CartItem = {
  key: string;
  productId: number;
  skuId: number;
  name: string;
  weight: string;
  price: number;
  mrp: number | null;
  image: string | null;
  category: string;
  quantity: number;
};

type StorefrontProps = {
  initialProducts: VFirstProduct[];
  initialPagination?: VFirstPagination;
  apiError: string | null;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const asset = (path: string) => `https://vfirstindia.com${path}`;

const brandAssets = {
  logo: "https://vfirstindia.com/vfirst-logo.png",
  wordmark: asset("/assets/logo-Dtumhje3.webp"),
  whiteLogo: asset("/assets/vfirst-logo-white-8CTUrF21.webp"),
  gallery: [
    asset("/assets/1-q1YlLJMq.webp"),
    asset("/assets/2-Cfn4KH8F.webp"),
    asset("/assets/3-BzPCCreM.webp"),
    asset("/assets/4-DjLP7PoK.webp"),
    asset("/assets/5-BGIX5mxz.webp")
  ],
  categories: [
    asset("/assets/Masalas_%20product%20page-DTM9wuXH.webp"),
    asset("/assets/Whole%20spices_product%20page-DdjurSvr.webp")
  ],
  farm: asset("/assets/4is%20to%203%20natual%20farm%20%20(1)-m9m9M9Wc.webp"),
  forest: asset("/assets/beautiful-japanese-forest-scene%20(1)-DIR7c1d5.webp"),
  seal: asset("/assets/quality_seal_1%20(1)-D2JixbvZ.webp")
};

const localFallbackArt = "/vfirst-surreal-spice-panorama.png";

const surrealStages = [
  brandAssets.forest,
  brandAssets.farm,
  brandAssets.categories[0],
  brandAssets.categories[1],
  brandAssets.gallery[1],
  brandAssets.gallery[3]
];

function normalizeProductImagePath(path: string) {
  const cleanPath = path.trim().replace(/^["']|["']$/g, "");

  if (!cleanPath) {
    return null;
  }

  return cleanPath.startsWith("http")
    ? cleanPath
    : `https://vfirst-api.chatloom.in/${cleanPath.replace(/^\//, "")}`;
}

function productImageEntries(product: VFirstProduct) {
  if (Array.isArray(product.images)) {
    return product.images.filter(Boolean);
  }

  if (typeof product.images !== "string" || !product.images.trim()) {
    return [];
  }

  const rawImages = product.images.trim();

  if (rawImages.startsWith("[") && rawImages.endsWith("]")) {
    try {
      const parsed = JSON.parse(rawImages) as unknown;

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (image): image is string => typeof image === "string" && Boolean(image.trim())
        );
      }
    } catch {
      return [];
    }
  }

  return rawImages
    .split(",")
    .map((image) => image.trim())
    .filter(Boolean);
}

function normalizeImage(product: VFirstProduct) {
  if (product.image_url) {
    return normalizeProductImagePath(product.image_url);
  }

  const first = productImageEntries(product)[0];

  if (!first) {
    return null;
  }

  return normalizeProductImagePath(first);
}

function surrealStageForKey(seed: number, category = "") {
  const categoryWeight = Array.from(category).reduce(
    (total, letter) => total + letter.charCodeAt(0),
    0
  );
  const index = Math.abs(seed + categoryWeight) % surrealStages.length;

  return surrealStages[index] ?? brandAssets.categories[0];
}

function surrealStageForProduct(product: VFirstProduct, index = 0) {
  return surrealStageForKey(product.id + index, categoryName(product));
}

function productImage(product: VFirstProduct, index = 0) {
  return normalizeImage(product) ?? surrealStageForProduct(product, index);
}

function imageErrorFallback(
  event: SyntheticEvent<HTMLImageElement>,
  fallback: string
) {
  const image = event.currentTarget;

  if (image.src !== fallback) {
    image.src = fallback;
    image.classList.add("fallback-art");
    return;
  }

  if (image.src !== localFallbackArt && image.dataset.finalFallback !== "true") {
    image.dataset.finalFallback = "true";
    image.src = localFallbackArt;
    image.classList.add("fallback-art");
  }
}

function skuPrice(sku: VFirstSku) {
  const price = Number.parseFloat(sku.price || "0");
  const compare = sku.compare_at_price
    ? Number.parseFloat(sku.compare_at_price)
    : null;

  return {
    price: Number.isFinite(price) ? price : 0,
    offer: compare && Number.isFinite(compare) ? compare : price,
    mrp: compare && Number.isFinite(compare) ? price : null
  };
}

function activeSkus(product: VFirstProduct) {
  return (product.skus ?? []).filter((sku) => sku.is_active);
}

function lowestSku(product: VFirstProduct) {
  return [...activeSkus(product)].sort((left, right) => {
    return skuPrice(left).offer - skuPrice(right).offer;
  })[0];
}

function categoryName(product: VFirstProduct) {
  return product.category?.name || "Natural Pantry";
}

function cleanName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

function shortDescription(description: string) {
  return description
    .replace(/\s+/g, " ")
    .replace(/Vfirst/gi, "VFirst")
    .trim();
}

function localProductsUrl({
  limit,
  category,
  search,
  onSale
}: {
  limit?: number;
  category?: string;
  search?: string;
  onSale?: boolean;
}) {
  const params = new URLSearchParams();

  if (limit) {
    params.set("limit", String(limit));
  }

  if (category) {
    params.set("category", category);
  }

  if (search) {
    params.set("search", search);
  }

  if (onSale) {
    params.set("onSale", "true");
  }

  return `/api/products?${params.toString()}`;
}

export default function Storefront({
  initialProducts,
  initialPagination,
  apiError
}: StorefrontProps) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState(apiError);
  const [productTotal, setProductTotal] = useState(
    initialPagination?.totalItems ?? initialProducts.length
  );
  const [activeProduct, setActiveProduct] = useState<VFirstProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [orderPlacedOpen, setOrderPlacedOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<CartItem[]>([]);
  const [selectedSku, setSelectedSku] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const storedCart = window.localStorage.getItem("vfirst_cart");
    const storedCustomer = window.localStorage.getItem("vfirst_customer");

    if (storedCart) {
      setCart(JSON.parse(storedCart) as CartItem[]);
    }

    if (storedCustomer) {
      setCustomer(storedCustomer);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("vfirst_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const updateHeader = () => {
      const hero = document.querySelector(".video-hero");
      const heroBottom = hero?.getBoundingClientRect().bottom;

      setHeaderVisible(
        typeof heroBottom === "number"
          ? heroBottom <= 0
          : window.scrollY > Math.max(180, window.innerHeight * 0.82)
      );
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);

    return () => {
      window.removeEventListener("scroll", updateHeader);
      window.removeEventListener("resize", updateHeader);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const url = localProductsUrl({
          limit: 60,
          category: selectedCategory === "All" ? undefined : selectedCategory,
          search: query || undefined,
          onSale: onSaleOnly || undefined
        });
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Product API responded with ${response.status}`);
        }

        const payload = (await response.json()) as {
          success: boolean;
          data: VFirstProduct[];
          pagination?: VFirstPagination;
        };

        if (!payload.success) {
          throw new Error("Product API returned an unsuccessful response");
        }

        setProducts(payload.data ?? []);
        setProductTotal(payload.pagination?.totalItems ?? payload.data?.length ?? 0);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError("Unable to refresh live products right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, query ? 280 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [selectedCategory, query, onSaleOnly]);

  const categories = useMemo(() => {
    const categorySource = products.length ? products : initialProducts;
    const found = new Set(categorySource.map(categoryName));
    return ["All", ...Array.from(found).sort()];
  }, [initialProducts, products]);

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const cartKeys = useMemo(() => new Set(cart.map((item) => item.key)), [cart]);

  function getSelectedSku(product: VFirstProduct) {
    const skus = activeSkus(product);
    const chosenId = selectedSku[product.id];
    return skus.find((sku) => sku.id === chosenId) ?? lowestSku(product);
  }

  function isSelectedSkuInCart(product: VFirstProduct) {
    const sku = getSelectedSku(product);
    return sku ? cartKeys.has(`${product.id}-${sku.id}`) : false;
  }

  function addToCart(product: VFirstProduct, sku = getSelectedSku(product)) {
    if (!sku) {
      return;
    }

    const price = skuPrice(sku);
    const item: CartItem = {
      key: `${product.id}-${sku.id}`,
      productId: product.id,
      skuId: sku.id,
      name: cleanName(product.name),
      weight: sku.weight,
      price: price.offer,
      mrp: price.mrp,
      image: productImage(product, product.id),
      category: categoryName(product),
      quantity: 1
    };

    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.key === item.key);

      if (existing) {
        return current.map((cartItem) =>
          cartItem.key === item.key
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...current, item];
    });
    setCartOpen(true);
  }

  function updateCart(key: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.key !== key));
      return;
    }

    setCart((current) =>
      current.map((item) => (item.key === key ? { ...item, quantity } : item))
    );
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name =
      String(formData.get("name") || "").trim() ||
      String(formData.get("email") || "Guest").split("@")[0];

    setCustomer(name);
    window.localStorage.setItem("vfirst_customer", name);
    setLoginOpen(false);
  }

  function placeOrder() {
    const orderedItems = [...cart];

    if (!orderedItems.length) {
      return;
    }

    setPlacedOrder(orderedItems);
    setCart([]);
    setCartOpen(false);
    setOrderPlacedOpen(true);
    window.localStorage.removeItem("vfirst_cart");

    window.setTimeout(() => {
      setOrderPlacedOpen(false);
      window.location.hash = "home";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 3600);
  }

  return (
    <main>
      <Header
        cartCount={cartCount}
        customer={customer}
        visible={headerVisible}
        onCart={() => setCartOpen(true)}
        onLogin={() => setLoginOpen(true)}
      />

      <HeroCinematicSection
        placedOrder={placedOrder}
        onLogin={() => setLoginOpen(true)}
      />

      <section className="trust-strip" aria-label="VFirst promises">
        {[
          ["Quality sealed", ShieldCheck],
          ["India shipping", Truck],
          ["Export ready", Globe2],
          ["Fresh batches", PackageCheck]
        ].map(([label, Icon]) => (
          <div className="trust-item" key={String(label)}>
            <Icon size={19} />
            <span>{String(label)}</span>
          </div>
        ))}
      </section>

      <section className="section-grid">
        <div className="section-copy">
          <p className="eyebrow dark">
            <Sparkles size={15} />
            Same brand, calmer theatre
          </p>
          <h2>Natural pantry goods, presented with restraint.</h2>
          <p>
            The live site uses a green, sage, and leaf-yellow identity. This
            rebuild keeps that palette, then uses surreal product staging and
            minimal shopping controls to make the catalogue feel more premium.
          </p>
        </div>
        <div className="category-stage">
          <div className="category-frame frame-main">
            <img src={brandAssets.categories[0]} alt="VFirst spice powders" />
          </div>
          <div className="category-frame frame-secondary">
            <img src={brandAssets.categories[1]} alt="VFirst whole spices" />
          </div>
          <img className="quality-seal" src={brandAssets.seal} alt="Quality seal" />
        </div>
      </section>

      <section className="shop-shell" id="shop">
        <div className="shop-heading">
          <p className="eyebrow dark">
            <SlidersHorizontal size={15} />
            Live products
          </p>
          <div>
            <h2>Shop the VFirst catalogue</h2>
            <p>{productTotal} products from the production product API.</p>
          </div>
        </div>

        <div className="shop-controls">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search spices, powders, seeds"
            />
          </label>

          <div className="category-tabs" aria-label="Product categories">
            {categories.map((category) => (
              <button
                className={selectedCategory === category ? "active" : ""}
                key={category}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <label className="sale-toggle">
            <input
              checked={onSaleOnly}
              onChange={(event) => setOnSaleOnly(event.target.checked)}
              type="checkbox"
            />
            <span>On sale</span>
          </label>
        </div>

        {error ? <div className="api-note">{error}</div> : null}

        <div className={`product-grid ${loading ? "loading" : ""}`}>
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              selectedSkuId={selectedSku[product.id]}
              onSku={(skuId) =>
                setSelectedSku((current) => ({ ...current, [product.id]: skuId }))
              }
              inCart={isSelectedSkuInCart(product)}
              onAdd={() => addToCart(product)}
              onView={() => setActiveProduct(product)}
            />
          ))}
        </div>

        {loading && products.length === 0 ? (
          <div className="empty-state loading-state">
            <Leaf size={22} />
            <p>Loading live VFirst products.</p>
          </div>
        ) : null}

        {!loading && !error && products.length === 0 ? (
          <div className="empty-state">
            <Leaf size={22} />
            <p>No live products matched this selection.</p>
          </div>
        ) : null}
      </section>

      <section className="journal-band">
        <div>
          <p className="eyebrow">
            <Heart size={15} />
            VFirst feeling
          </p>
          <h2>From clean sourcing to quiet shelves.</h2>
        </div>
        <div className="journal-images">
          {brandAssets.gallery.slice(0, 3).map((image, index) => (
            <img src={image} alt={`VFirst visual ${index + 1}`} key={image} />
          ))}
        </div>
      </section>

      <Footer />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        total={cartTotal}
        onClose={() => setCartOpen(false)}
        onUpdate={updateCart}
        onCheckout={placeOrder}
      />

      {activeProduct ? (
        <ProductModal
          product={activeProduct}
          selectedSkuId={selectedSku[activeProduct.id]}
          onSku={(skuId) =>
            setSelectedSku((current) => ({
              ...current,
              [activeProduct.id]: skuId
            }))
          }
          onClose={() => setActiveProduct(null)}
          onAdd={() => addToCart(activeProduct)}
          inCart={isSelectedSkuInCart(activeProduct)}
        />
      ) : null}

      {loginOpen ? (
        <LoginModal
          customer={customer}
          onClose={() => setLoginOpen(false)}
          onSubmit={submitLogin}
        />
      ) : null}

      {orderPlacedOpen ? <OrderPlacedModal items={placedOrder} /> : null}
    </main>
  );
}

function Header({
  cartCount,
  customer,
  visible,
  onCart,
  onLogin
}: {
  cartCount: number;
  customer: string | null;
  visible: boolean;
  onCart: () => void;
  onLogin: () => void;
}) {
  return (
    <header className={`site-header ${visible ? "visible" : "hidden-over-hero"}`}>
      <a className="brand" href="#home" aria-label="VFirst home">
        <img src={brandAssets.logo} alt="VFirst" />
      </a>

      <nav>
        <a href="#home">Home</a>
        <a href="#shop">Products</a>
        <a href="#story">Story</a>
      </nav>

      <div className="header-actions">
        <button className="icon-button account-button" onClick={onLogin}>
          <User size={19} />
          <span>{customer ?? "Login"}</span>
        </button>
        <button className="icon-button cart-button" onClick={onCart}>
          <ShoppingBag size={19} />
          <span className="cart-label">Cart</span>
          {cartCount > 0 ? <span className="cart-count">{cartCount}</span> : null}
        </button>
      </div>
    </header>
  );
}

function HeroCinematicSection({
  placedOrder,
  onLogin
}: {
  placedOrder: CartItem[];
  onLogin: () => void;
}) {
  const desktopVideo = "/ts_1_scrub.mp4";
  const desktopFallbackVideo = "/ts_1.mp4";
  const mobileVideo = "/ts_2_scrub.mp4";
  const mobileFallbackVideo = "/ts_2.mp4";
  const heroRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const copyVisibleRef = useRef(false);
  const [videoSrc, setVideoSrc] = useState(desktopVideo);
  const [videoReady, setVideoReady] = useState(false);
  const [videoDuration, setVideoDuration] = useState(1);
  const [copyVisible, setCopyVisible] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const updateSource = () => {
      const nextSource = media.matches ? mobileVideo : desktopVideo;

      setVideoSrc((currentSource) => {
        if (currentSource !== nextSource) {
          setVideoReady(false);
          smoothProgressRef.current = 0;
          targetProgressRef.current = 0;
          copyVisibleRef.current = false;
          setCopyVisible(false);
          return nextSource;
        }

        if (videoRef.current?.readyState) {
          setVideoReady(true);
        }

        return currentSource;
      });
    };

    updateSource();
    media.addEventListener("change", updateSource);

    return () => {
      media.removeEventListener("change", updateSource);
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const video = videoRef.current;

    if (!hero || !video || !videoReady) {
      return;
    }

    let frame = 0;
    let lastSeekAt = 0;
    const updateTargetProgress = () => {
      const rect = hero.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      targetProgressRef.current = Math.min(1, Math.max(0, -rect.top / scrollable));
    };
    const animateScrub = () => {
      const current = smoothProgressRef.current;
      const target = targetProgressRef.current;
      const nextProgress =
        Math.abs(target - current) < 0.001 ? target : current + (target - current) * 0.14;
      const targetTime = nextProgress * Math.max(0.01, videoDuration);
      const now = window.performance.now();
      const copyReveal = Math.min(1, Math.max(0, (nextProgress - 0.72) / 0.2));
      const nextCopyVisible = copyReveal > 0.08;

      smoothProgressRef.current = nextProgress;

      hero.style.setProperty("--hero-copy-opacity", copyReveal.toFixed(3));
      hero.style.setProperty("--hero-copy-y", `${((1 - copyReveal) * 28).toFixed(2)}px`);
      hero.style.setProperty(
        "--hero-shade-opacity",
        (0.44 + copyReveal * 0.36).toFixed(3)
      );
      hero.style.setProperty(
        "--scroll-cue-opacity",
        (1 - Math.min(1, nextProgress * 1.8)).toFixed(3)
      );

      if (nextCopyVisible !== copyVisibleRef.current) {
        copyVisibleRef.current = nextCopyVisible;
        setCopyVisible(nextCopyVisible);
      }

      if (
        Number.isFinite(targetTime) &&
        !video.seeking &&
        now - lastSeekAt > 28 &&
        Math.abs(video.currentTime - targetTime) > 0.018
      ) {
        lastSeekAt = now;
        video.currentTime = targetTime;
      }

      if (
        Math.abs(targetProgressRef.current - nextProgress) > 0.001 ||
        Math.abs(video.currentTime - targetTime) > 0.018
      ) {
        frame = window.requestAnimationFrame(animateScrub);
      } else {
        frame = 0;
      }
    };
    const startScrub = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(animateScrub);
      }
    };
    const queue = () => {
      updateTargetProgress();
      startScrub();
    };

    updateTargetProgress();
    startScrub();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, [videoDuration, videoReady, videoSrc]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const video = videoRef.current;

      if (video?.readyState) {
        setVideoDuration(video.duration || 1);
      }

      setVideoReady(true);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [videoSrc]);

  const heroStyle = {
    "--hero-copy-opacity": "0",
    "--hero-copy-y": "28px",
    "--hero-shade-opacity": "0.44",
    "--scroll-cue-opacity": "1"
  } as CSSProperties;

  return (
    <section
      className={`hero-shell video-hero ${videoReady ? "video-ready" : ""} ${
        copyVisible ? "copy-visible" : ""
      }`}
      id="home"
      ref={heroRef}
      style={heroStyle}
    >
      <div className="video-hero-sticky">
        <video
          key={videoSrc}
          ref={videoRef}
          className="video-hero-media"
          src={videoSrc}
          poster={localFallbackArt}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;

            video.pause();
            video.currentTime = 0;
            setVideoDuration(video.duration || 1);
            setVideoReady(true);
          }}
          onLoadedData={(event) => {
            event.currentTarget.pause();
            setVideoReady(true);
          }}
          onCanPlay={(event) => {
            event.currentTarget.pause();
            setVideoReady(true);
          }}
          onError={() => {
            if (videoSrc === mobileVideo) {
              setVideoSrc(mobileFallbackVideo);
            } else if (videoSrc === mobileFallbackVideo) {
              setVideoSrc(desktopVideo);
            } else if (videoSrc === desktopVideo) {
              setVideoSrc(desktopFallbackVideo);
            } else {
              setVideoReady(true);
            }
          }}
        />
        <div className="video-hero-shade" aria-hidden="true" />

        <div className={`hero-loader ${videoReady ? "loaded" : ""}`} role="status">
          <div className="loader-seal" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <strong>Preparing fresh batches</strong>
        </div>

        <div className="video-hero-content">
          <div className="eyebrow">
            <Leaf size={16} />
            VFirst Fresh & Natural
          </div>
          <h1>VFirst</h1>
          <p className="hero-lede">From whole spice to fresh VFirst pack.</p>
          <div className="hero-actions">
            <a className="primary-action" href="#shop">
              Shop live catalogue
              <ChevronRight size={18} />
            </a>
            <button className="ghost-action" onClick={onLogin}>
              <User size={18} />
              Login
            </button>
          </div>
          {placedOrder.length ? <PlacedOrderRibbon items={placedOrder} /> : null}
        </div>

        <a className="video-scroll-cue" href="#shop">
          <span>Scroll</span>
        </a>
      </div>
    </section>
  );
}

function HeroProductTheatre({
  products,
  progress = 0,
  onProduct,
  onAdd
}: {
  products: VFirstProduct[];
  progress?: number;
  onProduct: (product: VFirstProduct) => void;
  onAdd: (product: VFirstProduct) => void;
}) {
  const primaryProduct = products[0];
  const primaryDirectImage = primaryProduct ? normalizeImage(primaryProduct) : null;
  const primaryFallback = primaryProduct
    ? surrealStageForProduct(primaryProduct)
    : brandAssets.categories[1];
  const primaryImage = primaryDirectImage ?? primaryFallback;
  const primarySku = primaryProduct ? lowestSku(primaryProduct) : null;
  const primaryPrice = primarySku ? skuPrice(primarySku).offer : null;

  return (
    <div className="hero-product-theatre" aria-label="Featured VFirst product">
      <div className="theatre-aura" aria-hidden="true" />
      <button
        className="hero-pack"
        disabled={!primaryProduct}
        onClick={() => primaryProduct && onProduct(primaryProduct)}
      >
        <span className="pack-plate" aria-hidden="true" />
        {primaryImage ? (
          <img
            className={primaryDirectImage ? undefined : "fallback-art"}
            src={primaryImage}
            alt={primaryProduct ? cleanName(primaryProduct.name) : "VFirst product"}
            onError={(event) => imageErrorFallback(event, primaryFallback)}
          />
        ) : null}
        <span className="hero-pack-copy">
          <small>{primaryProduct ? categoryName(primaryProduct) : "Live catalogue"}</small>
          <strong>{primaryProduct ? cleanName(primaryProduct.name) : "Loading products"}</strong>
          <em>{primaryPrice ? currency.format(primaryPrice) : "From VFirst API"}</em>
        </span>
      </button>

      <div className="hero-shelf">
        {products.slice(1, 4).map((product, index) => {
          const directImage = normalizeImage(product);
          const fallback = surrealStageForProduct(product, index + 1);
          const image = directImage ?? fallback;
          const sku = lowestSku(product);
          const price = sku ? skuPrice(sku).offer : 0;

          return (
            <button
              className="shelf-product"
              key={product.id}
              onClick={() => onProduct(product)}
            >
              <span>
                <img
                  className={directImage ? undefined : "fallback-art"}
                  src={image}
                  alt={cleanName(product.name)}
                  onError={(event) => imageErrorFallback(event, fallback)}
                />
              </span>
              <strong>{cleanName(product.name)}</strong>
              <small>{price ? currency.format(price) : "Live item"}</small>
            </button>
          );
        })}
      </div>

      {primaryProduct ? (
        <button className="theatre-add" onClick={() => onAdd(primaryProduct)}>
          <ShoppingBag size={17} />
          Add first pick
        </button>
      ) : null}
    </div>
  );
}

function CinematicStory({
  products,
  onProduct,
  onAdd
}: {
  products: VFirstProduct[];
  onProduct: (product: VFirstProduct) => void;
  onAdd: (product: VFirstProduct) => void;
}) {
  const storyRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = storyRef.current;

    if (!element) {
      return;
    }

    let frame = 0;
    const update = () => {
      const rect = element.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const nextProgress = Math.min(1, Math.max(0, -rect.top / scrollable));
      setProgress(nextProgress);
    };
    const queue = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  const activeIndex = products.length
    ? Math.min(products.length - 1, Math.floor(progress * products.length))
    : 0;
  const activeProduct = products[activeIndex];
  const activeDirectImage = activeProduct ? normalizeImage(activeProduct) : null;
  const activeFallback = activeProduct
    ? surrealStageForProduct(activeProduct, activeIndex)
    : brandAssets.categories[1];
  const activeImage = activeDirectImage ?? activeFallback;
  const activeSku = activeProduct ? lowestSku(activeProduct) : null;
  const activePrice = activeSku ? skuPrice(activeSku).offer : null;
  const shellOpen = Math.min(1, Math.max(0, (progress - 0.14) / 0.42));
  const reveal = Math.min(1, Math.max(0, (progress - 0.38) / 0.5));

  const grains = Array.from({ length: 34 }, (_, index) => {
    const angle = (index / 34) * Math.PI * 2;
    const distance = 50 + (index % 7) * 17;
    const x = Math.cos(angle) * distance * shellOpen;
    const y = Math.sin(angle) * distance * shellOpen;

    return (
      <span
        key={index}
        style={
          {
            opacity: 0.2 + shellOpen * 0.78,
            transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${(
              angle *
              58 *
              shellOpen
            ).toFixed(2)}deg) scale(${(0.45 + shellOpen * 0.8).toFixed(3)})`
          } as CSSProperties
        }
      />
    );
  });

  const storyStyle = {
    "--story-progress": progress.toFixed(3),
    "--shell-open": shellOpen.toFixed(3),
    "--story-reveal": reveal.toFixed(3),
    "--stage-rotate": `${(-10 + progress * 20).toFixed(2)}deg`,
    "--stage-scale": (0.9 + reveal * 0.12).toFixed(3),
    "--copy-scroll": `${(-26 * progress).toFixed(2)}px`,
    "--product-lift": `${((1 - reveal) * 34).toFixed(2)}px`,
    "--product-scale": (0.86 + reveal * 0.14).toFixed(3),
    "--copy-x": `${((1 - reveal) * -34).toFixed(2)}px`,
    "--copy-y": `${((1 - reveal) * 20).toFixed(2)}px`,
    "--strip-x": `${((1 - reveal) * 86).toFixed(2)}px`
  } as CSSProperties;

  return (
    <section className="cinematic-story" ref={storyRef} style={storyStyle}>
      <div className="story-sticky">
        <div className="story-copy">
          <p className="eyebrow">
            <Leaf size={15} />
            Scroll the harvest
          </p>
          <h2>From sealed grain to open aroma.</h2>
          <div className="story-steps">
            {[
              ["01", "Source", "Clean harvests and whole spices arrive from trusted batches."],
              ["02", "Open", "The pod breaks visually as grains separate into motion."],
              ["03", "Choose", "The live catalogue resolves into selectable packs."]
            ].map(([number, title, text], index) => (
              <div
                className={`story-step ${progress >= index / 3 ? "active" : ""}`}
                key={number}
              >
                <span>{number}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="story-stage">
          <div className="grain-burst" aria-hidden="true">
            {grains}
          </div>

          <div className="story-product">
            <span
              className="pod-shell pod-left"
              style={{
                transform: `translateX(${(-78 * shellOpen).toFixed(2)}px) rotate(${(
                  -17 * shellOpen
                ).toFixed(2)}deg)`
              }}
            />
            <span
              className="pod-shell pod-right"
              style={{
                transform: `translateX(${(78 * shellOpen).toFixed(2)}px) rotate(${(
                  17 * shellOpen
                ).toFixed(2)}deg)`
              }}
            />

            <button
              className="story-product-image"
              disabled={!activeProduct}
              onClick={() => activeProduct && onProduct(activeProduct)}
            >
              {activeImage ? (
                <img
                  className={activeDirectImage ? undefined : "fallback-art"}
                  src={activeImage}
                  alt={activeProduct ? cleanName(activeProduct.name) : "VFirst product"}
                  onError={(event) => imageErrorFallback(event, activeFallback)}
                />
              ) : null}
            </button>
          </div>

          <div className="story-product-copy">
            <p>{activeProduct ? categoryName(activeProduct) : "Live catalogue"}</p>
            <h3>{activeProduct ? cleanName(activeProduct.name) : "Loading VFirst"}</h3>
            <span>{activePrice ? currency.format(activePrice) : "Opening products"}</span>
            {activeProduct ? (
              <button onClick={() => onAdd(activeProduct)}>
                <ShoppingBag size={17} />
                Add from story
              </button>
            ) : null}
          </div>

          <div className="story-strip" aria-label="Story products">
            {products.slice(0, 5).map((product, index) => {
              const directImage = normalizeImage(product);
              const fallback = surrealStageForProduct(product, index);
              const image = directImage ?? fallback;

              return (
                <button
                  className={index === activeIndex ? "active" : ""}
                  key={product.id}
                  onClick={() => onProduct(product)}
                >
                  <img
                    className={directImage ? undefined : "fallback-art"}
                    src={image}
                    alt={cleanName(product.name)}
                    onError={(event) => imageErrorFallback(event, fallback)}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  index,
  selectedSkuId,
  inCart,
  onSku,
  onAdd,
  onView
}: {
  product: VFirstProduct;
  index: number;
  selectedSkuId?: number;
  inCart: boolean;
  onSku: (skuId: number) => void;
  onAdd: () => void;
  onView: () => void;
}) {
  const skus = activeSkus(product);
  const chosen = skus.find((sku) => sku.id === selectedSkuId) ?? lowestSku(product);
  const price = chosen ? skuPrice(chosen) : null;
  const directImage = normalizeImage(product);
  const fallback = surrealStageForProduct(product, index);
  const image = directImage ?? fallback;

  return (
    <article
      className="product-card"
      style={
        {
          "--card-index": index,
          "--stage-image": `url("${fallback}")`
        } as CSSProperties
      }
    >
      <button className="product-image" onClick={onView} aria-label={product.name}>
        {product.on_sale ? <span className="sale-badge">Sale</span> : null}
        <img
          className={directImage ? undefined : "fallback-art"}
          src={image}
          alt={cleanName(product.name)}
          loading={index < 24 ? "eager" : "lazy"}
          onError={(event) => imageErrorFallback(event, fallback)}
        />
      </button>

      <div className="product-body">
        <p className="product-category">{categoryName(product)}</p>
        <h3>{cleanName(product.name)}</h3>
        <p>{shortDescription(product.description)}</p>

        <div className="sku-row">
          {skus.slice(0, 3).map((sku) => (
            <button
              className={chosen?.id === sku.id ? "active" : ""}
              key={sku.id}
              onClick={() => onSku(sku.id)}
            >
              {sku.weight}
            </button>
          ))}
        </div>

        <div className="price-row">
          <span>{price ? currency.format(price.offer) : "Live price"}</span>
          {price?.mrp ? <del>{currency.format(price.mrp)}</del> : null}
        </div>

        <div className="card-actions">
          <button className="small-ghost" onClick={onView}>
            Details
          </button>
          <button
            className={`small-primary ${inCart ? "added" : ""}`}
            onClick={onAdd}
            disabled={!chosen}
            aria-pressed={inCart}
          >
            {inCart ? <Check size={16} /> : <ShoppingBag size={16} />}
            {inCart ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </article>
  );
}

function CartDrawer({
  open,
  cart,
  total,
  onClose,
  onUpdate,
  onCheckout
}: {
  open: boolean;
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onUpdate: (key: string, quantity: number) => void;
  onCheckout: () => void;
}) {
  return (
    <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="drawer-panel">
        <div className="drawer-head">
          <div>
            <p className="eyebrow dark">Local cart</p>
            <h2>Your basket</h2>
          </div>
          <button className="round-button" onClick={onClose} aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        <div className="cart-list">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={28} />
              <p>Your basket is waiting.</p>
            </div>
          ) : (
            cart.map((item) => {
              const fallback = surrealStageForKey(item.productId, item.category);
              const image = item.image ?? fallback;

              return (
                <div className="cart-item" key={item.key}>
                  <div
                    className="cart-thumb"
                    style={{ "--stage-image": `url("${fallback}")` } as CSSProperties}
                  >
                    <img
                      src={image}
                      alt={item.name}
                      onError={(event) => imageErrorFallback(event, fallback)}
                    />
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.weight} · {currency.format(item.price)}
                    </span>
                    <div className="qty">
                      <button onClick={() => onUpdate(item.key, item.quantity - 1)}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdate(item.key, item.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                      <button
                        className="cart-delete"
                        onClick={() => onUpdate(item.key, 0)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="drawer-foot">
          <div>
            <span>Total</span>
            <strong>{currency.format(total)}</strong>
          </div>
          <button className="primary-action full" disabled={!cart.length} onClick={onCheckout}>
            Checkout
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <button className="drawer-scrim" onClick={onClose} aria-label="Close cart" />
    </aside>
  );
}

function ProductModal({
  product,
  selectedSkuId,
  inCart,
  onSku,
  onClose,
  onAdd
}: {
  product: VFirstProduct;
  selectedSkuId?: number;
  inCart: boolean;
  onSku: (skuId: number) => void;
  onClose: () => void;
  onAdd: () => void;
}) {
  const skus = activeSkus(product);
  const chosen = skus.find((sku) => sku.id === selectedSkuId) ?? lowestSku(product);
  const price = chosen ? skuPrice(chosen) : null;
  const directImage = normalizeImage(product);
  const fallback = surrealStageForProduct(product);
  const image = directImage ?? fallback;

  return (
    <div className="modal">
      <button className="modal-scrim" onClick={onClose} aria-label="Close details" />
      <div
        className="product-modal"
        style={{ "--stage-image": `url("${fallback}")` } as CSSProperties}
      >
        <button className="round-button modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="modal-image">
          <img
            className={directImage ? undefined : "fallback-art"}
            src={image}
            alt={cleanName(product.name)}
            onError={(event) => imageErrorFallback(event, fallback)}
          />
        </div>
        <div className="modal-copy">
          <p className="eyebrow dark">{categoryName(product)}</p>
          <h2>{cleanName(product.name)}</h2>
          <p>{shortDescription(product.description)}</p>
          <div className="sku-row large">
            {skus.map((sku) => (
              <button
                className={chosen?.id === sku.id ? "active" : ""}
                key={sku.id}
                onClick={() => onSku(sku.id)}
              >
                {sku.weight}
              </button>
            ))}
          </div>
          <div className="price-row large">
            <span>{price ? currency.format(price.offer) : "Live price"}</span>
            {price?.mrp ? <del>{currency.format(price.mrp)}</del> : null}
          </div>
          <button className={`primary-action full ${inCart ? "added" : ""}`} onClick={onAdd}>
            {inCart ? <Check size={18} /> : <ShoppingBag size={18} />}
            {inCart ? "Added to cart" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginModal({
  customer,
  onClose,
  onSubmit
}: {
  customer: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="modal">
      <button className="modal-scrim" onClick={onClose} aria-label="Close login" />
      <form className="form-modal" onSubmit={onSubmit}>
        <button className="round-button modal-close" type="button" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow dark">
          <Lock size={14} />
          Account
        </p>
        <h2>{customer ? `Welcome, ${customer}` : "Create a local session"}</h2>
        <label>
          Name
          <input name="name" placeholder="Your name" />
        </label>
        <label>
          Email
          <input name="email" placeholder="you@example.com" type="email" />
        </label>
        <button className="primary-action full" type="submit">
          Continue locally
          <ChevronRight size={18} />
        </button>
      </form>
    </div>
  );
}

function PlacedOrderRibbon({ items }: { items: CartItem[] }) {
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const featuredItem = items[0];

  if (!featuredItem) {
    return null;
  }

  const fallback = surrealStageForKey(featuredItem.productId, featuredItem.category);

  return (
    <div className="placed-ribbon">
      <span className="placed-thumb">
        <img
          src={featuredItem.image ?? fallback}
          alt={featuredItem.name}
          onError={(event) => imageErrorFallback(event, fallback)}
        />
      </span>
      <span>
        <small>Order placed</small>
        <strong>{featuredItem.name}</strong>
        <em>{itemCount} {itemCount === 1 ? "item" : "items"} confirmed</em>
      </span>
    </div>
  );
}

function OrderPlacedModal({ items }: { items: CartItem[] }) {
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const featuredItem = items[0];

  return (
    <div className="modal order-placed">
      <div className="modal-scrim" aria-hidden="true" />
      <div className="order-card" role="status" aria-live="polite">
        <div className="order-animation" aria-hidden="true">
          <div className="order-road" />
          <div className="order-truck">
            <div className="truck-cabin" />
            <div className="truck-box" />
            <span className="wheel front" />
            <span className="wheel back" />
          </div>
          <div className="order-plant">
            <span className="stem" />
            <span className="leaf left" />
            <span className="leaf right" />
          </div>
          <div className="order-check">
            <Check size={34} />
          </div>
        </div>
        <p className="eyebrow dark">Order placed</p>
        <h2>{itemCount} {itemCount === 1 ? "item" : "items"} confirmed</h2>
        {featuredItem ? (
          <p>
            {featuredItem.name} is packed. Taking you back home with your placed item.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer" id="story">
      <div>
        <img src={brandAssets.whiteLogo} alt="VFirst" />
        <p>Premium natural products from Iyengars Home Products Pvt. Ltd.</p>
      </div>
      <div>
        <strong>Contact</strong>
        <a href="tel:+919535121181">+91 9535121181</a>
        <a href="mailto:contactus@ihpiyengars.com">contactus@ihpiyengars.com</a>
      </div>
      <div>
        <strong>Experience</strong>
        <span>Products from live API</span>
        <span>Cart and login are local</span>
      </div>
    </footer>
  );
}
