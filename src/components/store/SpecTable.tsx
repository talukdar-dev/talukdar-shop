import type { Product } from '@/lib/types';
import { effectivePrice, taka } from '@/lib/format';

function GroupHead({ children }: { children: string }) {
  return (
    <tr className="bg-gray-50">
      <td colSpan={2} className="px-4 py-2.5 text-[14px] font-bold text-navy">
        {children}
      </td>
    </tr>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-2.5 w-[38%] text-[13.5px] font-semibold text-gray-600 align-top">
        {k}
      </td>
      <td className="px-4 py-2.5 text-[13.5px] text-gray-800">{v}</td>
    </tr>
  );
}

export default function SpecTable({ product }: { product: Product }) {
  const specs = product.specs ?? {};
  const stock = product.stock_qty > 0 ? 'In Stock' : 'Out of Stock';

  return (
    <div className="overflow-hidden rounded-md border border-[#e8e8e8] bg-white">
      <table className="w-full">
        <tbody>
          <GroupHead>General Information</GroupHead>
          <Row k="Price" v={taka(effectivePrice(product))} />
          {product.old_price ? <Row k="Regular Price" v={taka(product.old_price)} /> : null}
          <Row k="Status" v={stock} />
          <Row k="Product Code" v={product.sku} />
          {product.brand && <Row k="Brand" v={product.brand.name} />}
          {Object.keys(specs).length > 0 && (
            <>
              <GroupHead>Specifications</GroupHead>
              {Object.entries(specs).map(([k, v]) => (
                <Row key={k} k={k} v={Array.isArray(v) ? v.join(', ') : v} />
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
