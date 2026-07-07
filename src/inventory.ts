export interface Inventory {
  weapons: (string | null)[];
  weaponIndex: number;
  ammo: Record<string, number>;
  armor: number;
  maxWeaponSlots: number;
}

export function createInventory(): Inventory {
  return {
    weapons: [null, null],
    weaponIndex: 0,
    ammo: { rifle: 90, pistol: 45, grenade: 4 },
    armor: 0,
    maxWeaponSlots: 2,
  };
}

export function pickupWeapon(inv: Inventory, type: string): boolean {
  for (let i = 0; i < inv.maxWeaponSlots; i++) {
    if (inv.weapons[i] === null) {
      inv.weapons[i] = type;
      return true;
    }
  }
  return false;
}

export function pickupAmmo(inv: Inventory, type: string, amount: number) {
  inv.ammo[type] = (inv.ammo[type] || 0) + amount;
}

export function pickupArmor(inv: Inventory, amount: number) {
  inv.armor = Math.min(inv.armor + amount, 100);
}

export function switchWeapon(inv: Inventory, index: number) {
  if (index >= 0 && index < inv.maxWeaponSlots && inv.weapons[index] !== null) {
    inv.weaponIndex = index;
  }
}
