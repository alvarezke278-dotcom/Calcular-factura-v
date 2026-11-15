import React, { useMemo, useRef, useState } from 'react';
import {
  BookUser,
  Building2,
  Check,
  Mail,
  Pencil,
  Phone,
  ReceiptText,
  Search,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import type { ClientRecord } from '../types/invoice';
import { parseVCardContact } from '../utils/contactParser';

interface BrowserContactRecord {
  name?: string[];
  tel?: string[];
  email?: string[];
}

interface NavigatorWithContacts extends Navigator {
  contacts?: {
    select: (
      properties: Array<'name' | 'tel' | 'email'>,
      options?: { multiple?: boolean }
    ) => Promise<BrowserContactRecord[]>;
    getProperties?: () => Promise<string[]>;
  };
}

interface ClientsViewProps {
  clients: ClientRecord[];
  onSaveClient: (client: ClientRecord) => void;
  onDeleteClient: (id: string) => void;
  onUseClientInInvoice: (client: ClientRecord) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onSaveClient,
  onDeleteClient,
  onUseClientInInvoice,
}) => {
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [contactNotice, setContactNotice] = useState<string | null>(null);
  const [showVcfFallback, setShowVcfFallback] = useState(false);
  const vcfInputRef = useRef<HTMLInputElement | null>(null);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.building.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [clients, query]);

  const openNewForm = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setBuilding('');
    setEmail('');
    setFormError(null);
    setContactNotice(null);
    setShowVcfFallback(false);
    setShowForm(true);
  };

  const openEditForm = (client: ClientRecord) => {
    setEditingId(client.id);
    setName(client.name);
    setPhone(client.phone);
    setBuilding(client.building);
    setEmail(client.email);
    setFormError(null);
    setContactNotice(null);
    setShowVcfFallback(false);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
    setContactNotice(null);
    setShowVcfFallback(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() && !phone.trim() && !building.trim() && !email.trim()) {
      setFormError('Ingresa al menos el nombre o un dato de contacto del cliente.');
      return;
    }

    const existing = editingId ? clients.find((c) => c.id === editingId) : undefined;
    onSaveClient({
      id: editingId || `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      phone: phone.trim(),
      building: building.trim(),
      email: email.trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    });

    setShowForm(false);
    setEditingId(null);
    setContactNotice(null);
  };

  const handlePickFromContacts = async () => {
    setContactNotice(null);
    const nav = navigator as NavigatorWithContacts;

    if (nav.contacts && typeof nav.contacts.select === 'function') {
      try {
        const supported = nav.contacts.getProperties
          ? await nav.contacts.getProperties()
          : ['name', 'tel', 'email'];
        const props = (['name', 'tel', 'email'] as const).filter((p) =>
          supported.includes(p)
        );
        const selected = await nav.contacts.select(
          props.length > 0 ? [...props] : ['name', 'tel', 'email'],
          { multiple: false }
        );
        if (selected.length > 0) {
          const contact = selected[0];
          if (contact.name?.[0]) setName(contact.name[0]);
          if (contact.tel?.[0]) setPhone(contact.tel[0]);
          if (contact.email?.[0]) setEmail(contact.email[0]);
          setShowVcfFallback(false);
          setContactNotice('Contacto cargado correctamente en los campos.');
        }
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    setShowVcfFallback(true);
    setContactNotice(
      'La agenda directa del teléfono funciona en Chrome para Android. Aquí puedes importar un archivo de contacto (.vcf) o llenar los datos.'
    );
  };

  const handleVcfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseVCardContact(text);
      if (parsed.name) setName(parsed.name);
      if (parsed.phone) setPhone(parsed.phone);
      if (parsed.building) setBuilding(parsed.building);
      if (parsed.email) setEmail(parsed.email);

      if (parsed.name || parsed.phone || parsed.email || parsed.building) {
        setContactNotice('Datos importados desde el archivo de contacto.');
      } else {
        setContactNotice('No se encontraron datos válidos en el archivo .vcf.');
      }
    } catch {
      setContactNotice('No se pudo leer el archivo de contacto.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
              Clientes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {clients.length}{' '}
              {clients.length === 1 ? 'cliente registrado' : 'clientes registrados'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label className="relative block sm:w-64">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <span className="sr-only">Buscar cliente</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nombre, celular, edificación..."
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
              />
            </label>

            {!showForm && (
              <button
                type="button"
                data-testid="add-new-client-btn"
                onClick={openNewForm}
                className="min-h-[44px] rounded-xl bg-[#28419A] hover:bg-[#1F347E] px-4 py-2 text-xs sm:text-sm font-semibold text-white inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Añadir Cliente</span>
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            data-testid="directory-client-form"
            className="pt-3 border-t border-slate-100 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePickFromContacts}
                  className="min-h-[40px] rounded-xl border border-[#28419A] bg-[#28419A]/5 hover:bg-[#28419A]/10 px-3 py-1.5 text-xs font-semibold text-[#28419A] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <BookUser className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Añadir desde Contacto</span>
                </button>

                {showVcfFallback && (
                  <>
                    <input
                      ref={vcfInputRef}
                      type="file"
                      accept=".vcf,text/vcard"
                      aria-label="Seleccionar archivo de contacto .vcf"
                      onChange={handleVcfFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => vcfInputRef.current?.click()}
                      className="min-h-[40px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Importar archivo (.vcf)</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {contactNotice && (
              <p
                role="status"
                className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700"
              >
                {contactNotice}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Nombre y apellidos
                </span>
                <input
                  type="text"
                  aria-label="Nombre y apellidos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza López"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Número de celular
                </span>
                <input
                  type="tel"
                  aria-label="Número de celular"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +505 8812-3456"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Edificación
                </span>
                <input
                  type="text"
                  aria-label="Edificación"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="Ej. Torre Empresarial Norte"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Correo electrónico
                </span>
                <input
                  type="email"
                  aria-label="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej. cliente@correo.com"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>
            </div>

            {formError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {formError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="min-h-[42px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>Cancelar</span>
              </button>

              <button
                type="submit"
                className="min-h-[42px] rounded-xl bg-[#1E824C] hover:bg-[#196E40] px-4 py-2 text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Guardar Cliente</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {filteredClients.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {clients.length === 0
              ? 'Aún no has añadido clientes.'
              : 'No se encontraron clientes con esa búsqueda.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Presiona Añadir Cliente para guardar tus clientes frecuentes.
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="clients-list">
          {filteredClients.map((client) => (
            <article
              key={client.id}
              className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {client.name || 'Cliente sin nombre'}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  {client.phone && (
                    <span className="inline-flex items-center gap-1 font-mono-num">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>{client.phone}</span>
                    </span>
                  )}
                  {client.building && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>{client.building}</span>
                    </span>
                  )}
                  {client.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>{client.email}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onUseClientInInvoice(client)}
                  className="min-h-[42px] px-3 rounded-xl bg-[#28419A] hover:bg-[#1F347E] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ReceiptText className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Facturar</span>
                </button>

                <button
                  type="button"
                  onClick={() => openEditForm(client)}
                  aria-label={`Editar cliente ${client.name || client.phone}`}
                  className="min-h-[42px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Pencil className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteClient(client.id)}
                  aria-label={`Eliminar cliente ${client.name || client.phone}`}
                  className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
