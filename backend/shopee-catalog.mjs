// Exact listing identity verified through the connected Shopee product search on 25 Oct 2026.
export function catalogFor(productUrl){
 let u;try{u=new URL(productUrl);}catch{return null;}
 if(u.hostname!=='shopee.co.id'||u.protocol!=='https:')return null;
 const exact=/^\/product\/607593297\/41561442154\/?$/.test(u.pathname)||/-i\.607593297\.41561442154$/.test(u.pathname);
 if(!exact)return null;
 return {id:'41561442154',shopId:'607593297',shopName:'HLF24oke',productName:'Botol Tumbler 900ml Stainless Steel Tahan Panas Dingin',imageUrl:'assets/shopee-products/41561442154.jpg?v=20261025',productUrl:'https://shopee.co.id/product/607593297/41561442154',source:'Foto katalog listing Shopee',sourceImageUrl:'https://down-id.img.susercontent.com/file/id-11134207-7ra0o-mcx19on2d22d2e',verifiedAt:'2026-10-25'};
}
export const catalogImageFile=new URL('./catalog-media/41561442154.jpg',import.meta.url);
