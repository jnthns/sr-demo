'use client'

import { useEffect, useMemo, useState } from 'react';

const createDefaultItem = () => ([
  { key: 'product_id', value: '1' },
  { key: 'id', value: '45360-32' },
  { key: 'name', value: 'Special Facial Soap' },
  { key: 'category', value: 'beauty' },
  { key: 'price', value: '12.6' }
]);

const createSecondItem = () => ([
  { key: 'product_id', value: '5' },
  { key: 'id', value: '47738-11' },
  { key: 'name', value: 'Fancy Hairbrush' },
  { key: 'category', value: 'beauty' },
  { key: 'price', value: '18.9' }
]);

const toTypedValue = (rawValue) => {
  if (rawValue === '') return '';
  const asNumber = Number(rawValue);
  if (!Number.isNaN(asNumber) && rawValue.trim() !== '') {
    return asNumber;
  }
  if (rawValue === 'true') return true;
  if (rawValue === 'false') return false;
  return rawValue;
};

function CartArrayBuilder({
  title,
  parentKey,
  setParentKey,
  items,
  setItems,
  otherKeys,
  onDuplicateAcross
}) {
  const [dragState, setDragState] = useState(null);
  const jsonPreview = useMemo(() => {
    const parsedItems = items.map((fields) => {
      const obj = {};
      fields.forEach(({ key, value }) => {
        if (!key.trim()) return;
        obj[key.trim()] = toTypedValue(value);
      });
      return obj;
    });

    return JSON.stringify({ [parentKey.trim() || 'products']: parsedItems }, null, 2);
  }, [items, parentKey]);

  const updateField = (itemIndex, fieldIndex, nextField) => {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== itemIndex) return item;
      return item.map((field, fIdx) => (fIdx === fieldIndex ? { ...field, ...nextField } : field));
    }));
  };

  const addField = (itemIndex) => {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== itemIndex) return item;
      return [...item, { key: 'new_key', value: '' }];
    }));
  };

  const removeField = (itemIndex, fieldIndex) => {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== itemIndex) return item;
      return item.filter((_, fIdx) => fIdx !== fieldIndex);
    }));
  };

  const duplicateField = (itemIndex, fieldIndex) => {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== itemIndex) return item;
      const next = [...item];
      next.splice(fieldIndex + 1, 0, { ...item[fieldIndex] });
      return next;
    }));
  };

  const moveField = (itemIndex, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== itemIndex) return item;
      const next = [...item];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    }));
  };

  const addItem = () => {
    setItems((prev) => [...prev, createDefaultItem()]);
  };

  const removeItem = (itemIndex) => {
    setItems((prev) => prev.filter((_, idx) => idx !== itemIndex));
  };

  const renderJsonPreview = () => {
    const lines = jsonPreview.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith(`"${parentKey}"`) && trimmed.endsWith('[')) {
        return <span key={index}>{line}{'\n'}</span>;
      }
      const match = line.match(/^\s*"([^"]+)"\s*:/);
      if (!match) {
        return <span key={index}>{line}{'\n'}</span>;
      }
      const key = match[1];
      const isShared = otherKeys.has(key);
      const lineClass = isShared ? 'text-gray-100' : 'text-red-400';
      return (
        <span key={index} className={lineClass}>
          {line}{'\n'}
        </span>
      );
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">JSON Preview</h3>
        <pre className="whitespace-pre-wrap break-words rounded-lg bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto">
          {renderJsonPreview()}
        </pre>
      </div>

      <div>
        <label htmlFor={`${title}-parent-key`} className="block text-sm font-medium mb-1">
          Parent Property Key
        </label>
        <input
          id={`${title}-parent-key`}
          value={parentKey}
          onChange={(event) => setParentKey(event.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700"
          placeholder="products"
        />
      </div>

      <div className="space-y-6">
        {items.map((fields, itemIndex) => (
          <div key={`item-${itemIndex}`} className="border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Item {itemIndex + 1}</h3>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(itemIndex)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Remove item
                </button>
              )}
            </div>

            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Key</span>
              <span>Value</span>
              <span></span>
            </div>
            <div className="space-y-2">
              {fields.map((field, fieldIndex) => {
                return (
                  <div
                    key={`field-${itemIndex}-${fieldIndex}`}
                    className={`grid grid-cols-[1fr_1fr_auto] gap-2 items-center rounded-md ${
                      dragState?.itemIndex === itemIndex && dragState?.fieldIndex === fieldIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      setDragState({ itemIndex, fieldIndex });
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (dragState?.itemIndex === itemIndex) {
                        moveField(itemIndex, dragState.fieldIndex, fieldIndex);
                      }
                      setDragState(null);
                    }}
                    onDragEnd={() => setDragState(null)}
                  >
                  <input
                    value={field.key}
                    onChange={(event) => updateField(itemIndex, fieldIndex, { key: event.target.value })}
                    className="rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700"
                    placeholder="key"
                  />
                  <input
                    value={field.value}
                    onChange={(event) => updateField(itemIndex, fieldIndex, { value: event.target.value })}
                    className="rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700"
                    placeholder="value"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateField(itemIndex, fieldIndex)}
                      className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                      aria-label="Duplicate field"
                      title="Duplicate field"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="11" height="11" rx="2" />
                        <rect x="4" y="4" width="11" height="11" rx="2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateAcross(itemIndex, fieldIndex)}
                      className="p-2 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20"
                      aria-label="Duplicate to other array"
                      title="Duplicate to other array"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 12h10" />
                        <path d="M10 8l4 4-4 4" />
                        <rect x="14" y="4" width="6" height="16" rx="2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(itemIndex, fieldIndex)}
                      className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      aria-label="Remove field"
                      title="Remove field"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M8 6v12c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => addField(itemIndex)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              + Add field
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        + Add item
      </button>
    </div>
  );
}

export default function CartAnalysisPage() {
  const [primaryKey, setPrimaryKey] = useState('product_engagement');
  const [primaryItems, setPrimaryItems] = useState([createDefaultItem(), createSecondItem()]);
  const [secondaryKey, setSecondaryKey] = useState('cart_contents');
  const [secondaryItems, setSecondaryItems] = useState([createDefaultItem(), createSecondItem()]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cart-analysis-builder');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.primaryKey) setPrimaryKey(parsed.primaryKey);
        if (parsed.secondaryKey) setSecondaryKey(parsed.secondaryKey);
        if (Array.isArray(parsed.primaryItems)) setPrimaryItems(parsed.primaryItems);
        if (Array.isArray(parsed.secondaryItems)) setSecondaryItems(parsed.secondaryItems);
      } catch (error) {
        console.warn('Failed to load cart analysis state:', error);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const payload = {
      primaryKey,
      secondaryKey,
      primaryItems,
      secondaryItems
    };
    localStorage.setItem('cart-analysis-builder', JSON.stringify(payload));
  }, [primaryKey, secondaryKey, primaryItems, secondaryItems, isHydrated]);
  const { primaryKeys, secondaryKeys } = useMemo(() => {
    const extractKeys = (items) => new Set(
      items
        .flatMap((fields) => fields.map((field) => field.key.trim()))
        .filter((key) => key.length > 0)
    );
    return {
      primaryKeys: extractKeys(primaryItems),
      secondaryKeys: extractKeys(secondaryItems)
    };
  }, [primaryItems, secondaryItems]);

  const { sharedKeys, uniquePrimaryKeys, uniqueSecondaryKeys } = useMemo(() => {
    const shared = [...primaryKeys].filter((key) => secondaryKeys.has(key));
    const uniquePrimary = [...primaryKeys].filter((key) => !secondaryKeys.has(key));
    const uniqueSecondary = [...secondaryKeys].filter((key) => !primaryKeys.has(key));
    return {
      sharedKeys: shared.sort((a, b) => a.localeCompare(b)),
      uniquePrimaryKeys: uniquePrimary.sort((a, b) => a.localeCompare(b)),
      uniqueSecondaryKeys: uniqueSecondary.sort((a, b) => a.localeCompare(b))
    };
  }, [primaryKeys, secondaryKeys]);

  const duplicateAcross = (source, itemIndex, fieldIndex) => {
    const isPrimary = source === 'primary';
    const sourceItems = isPrimary ? primaryItems : secondaryItems;
    const setTargetItems = isPrimary ? setSecondaryItems : setPrimaryItems;
    const field = sourceItems[itemIndex]?.[fieldIndex];
    if (!field) return;

    setTargetItems((prev) => {
      const next = prev.map((item) => [...item]);
      if (!next[itemIndex]) {
        next[itemIndex] = [{ ...field }];
      } else {
        next[itemIndex].push({ ...field });
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-semibold mb-2">Cart Object Array Builder</h1>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <a
              href="https://amplitude.com/docs/analytics/charts/cart-analysis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Documentation: Amplitude cart analysis
            </a>
            <p><b>Why do we need two object arrays for an e-commerce use case?</b></p>
            <p>
              Product Engagement details the product(s) interacted with in the event, while Cart
              Contents details the state of the overall cart at the time of the event.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <CartArrayBuilder
            title="Object Array A"
            parentKey={primaryKey}
            setParentKey={setPrimaryKey}
            items={primaryItems}
            setItems={setPrimaryItems}
            otherKeys={secondaryKeys}
            onDuplicateAcross={(itemIndex, fieldIndex) => duplicateAcross('primary', itemIndex, fieldIndex)}
          />
          <CartArrayBuilder
            title="Object Array B"
            parentKey={secondaryKey}
            setParentKey={setSecondaryKey}
            items={secondaryItems}
            setItems={setSecondaryItems}
            otherKeys={primaryKeys}
            onDuplicateAcross={(itemIndex, fieldIndex) => duplicateAcross('secondary', itemIndex, fieldIndex)}
          />
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Answerable Use Cases
              </h3>
              {sharedKeys.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                  {sharedKeys.map((key) => (
                    <li key={`shared-${key}`}>
                      {' '}
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-700">
                        {primaryKey}.{key}
                      </span>{' '}
                      can be joined with{' '}
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-700">
                        {secondaryKey}.{key}
                      </span>{' '}
                      in charts
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add matching keys in both arrays to see joinable examples.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Review
              </h3>
              {uniquePrimaryKeys.length === 0 && uniqueSecondaryKeys.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No unmatched keys to review.
                </p>
              ) : (
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                  {uniquePrimaryKeys.map((key) => (
                    <li key={`review-primary-${key}`}>
                      {' '}
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-700">
                        {primaryKey}.{key}
                      </span>{' '}
                      does not match any other property
                    </li>
                  ))}
                  {uniqueSecondaryKeys.map((key) => (
                    <li key={`review-secondary-${key}`}>
                      {' '}
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-700">
                        {secondaryKey}.{key}
                      </span>{' '}
                      does not match any other property
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <h2 className="text-xl font-semibold">Use Case Examples</h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            <li>
              “For a given ProductID/SKU, what’s the conversion from Product Viewed → Added to Cart
              → Order Completed?”
              <ul className="mt-1 ml-5 list-disc text-gray-600 dark:text-gray-300">
                <li>
                  The dual object arrays support this question so that you can always filter on the
                  same property value.
                </li>
              </ul>
            </li>
            <li>
              “Where items are added (PLP/PDP/carousel/cart) and in what order?” “Which items were
              added first and ended up building the basket around them?”
              <ul className="mt-1 ml-5 list-disc text-gray-600 dark:text-gray-300">
                <li>Track an order-in-cart property in the Cart_Contents array.</li>
              </ul>
            </li>
            <li>
              “What else is in the cart at the time of each key action?”
              <ul className="mt-1 ml-5 list-disc text-gray-600 dark:text-gray-300">
                <li>
                  The cart object array helps you track the state of the cart as the user navigates
                  the website.
                </li>
              </ul>
            </li>
            <li>
              “Which recommendation pods/carousels and suggested products actually drive
              conversion?”
              <ul className="mt-1 ml-5 list-disc text-gray-600 dark:text-gray-300">
                <li>
                  Track the type of item in the Product_Engagement array, such as
                  recommendation/gift/bundle.
                </li>
              </ul>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
