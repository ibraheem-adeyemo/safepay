type Role    = "Buyer" | "Seller" | "";
type Scammed = "Yes"   | "No"    | "";
type ModalStep = "tx" | "gate" | "waitlist" | "submitting" | "success" | "error";
 
interface TxForm     { itemName: string; dealAmount: string; role: Role; }
interface TxErrors   { itemName?: string; dealAmount?: string; role?: string; }
interface WlForm     { name: string; email: string; phoneNumber: string; }
interface WlErrors   { name?: string; email?: string; scammed?: string; phoneNumber?:string }
 