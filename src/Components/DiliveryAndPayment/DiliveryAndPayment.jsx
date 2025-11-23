// src/Components/DiliveryAndPayment/DiliveryAndPayment.jsx
import React, { useState, useEffect, useRef } from 'react';
import QrCode from '../../assets/paymentImage/qrcode.png';
import { toast } from "react-toastify";
// 25 Official Provinces of Cambodia
const cambodiaProvinces = [
  "Phnom Penh", "Banteay Meanchey", "Battambang", "Kampong Cham", "Kampong Chhnang",
  "Kampong Speu", "Kampong Thom", "Kampot", "Kandal", "Koh Kong", "Kratié",
  "Mondulkiri", "Oddar Meanchey", "Pailin", "Preah Vihear", "Prey Veng",
  "Pursat", "Ratanakiri", "Siem Reap", "Sihanoukville", "Stung Treng",
  "Svay Rieng", "Takeo", "Tbong Khmum", "Kep"
];
// === SEARCHABLE PROVINCE SELECT ===
function ProvinceSearchSelect({ onProvinceChange, value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(value || '');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const filteredProvinces = cambodiaProvinces.filter(p =>
    p.toLowerCase().includes(query.toLowerCase())
  );
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleSelect = (province) => {
    setSelected(province);
    setQuery(province);
    setIsOpen(false);
    onProvinceChange(province);
    onChange(province);
  };
  useEffect(() => {
    setQuery(value || '');
    setSelected(value || '');
  }, [value]);
  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          const newQuery = e.target.value;
          setQuery(newQuery);
          setIsOpen(true);
          setSelected('');
          onChange('');
          onProvinceChange('');
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search or select province..."
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
        required
      />
      <select
        name="province"
        value={selected}
        onChange={() => {}}
        className="hidden"
        required
      >
        <option value="">Select province</option>
        {cambodiaProvinces.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <div
        className={`absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen
            ? 'max-h-60 opacity-100' // Expanded
            : 'max-h-0 opacity-0' // Collapsed
        }`}
      >
        <div className="overflow-auto" style={{ maxHeight: isOpen ? '240px' : '0' }}>
          {filteredProvinces.length > 0 ? (
            filteredProvinces.map(p => (
              <div
                key={p}
                onClick={() => handleSelect(p)}
                className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-gray-800 transition"
              >
                {p}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 italic">No provinces found</div>
          )}
        </div>
      </div>
    </div>
  );
}
// === FILE UPLOAD WITH REMOVE BUTTON ===
function FileUploadWithRemove({ onResetFile, onFileChange }) {
  const [file, setFile] = useState(null);
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (onFileChange) onFileChange(selectedFile ? selectedFile.name : null);
  };
  const handleRemove = () => {
    setFile(null);
    document.getElementById('proof-of-address-input').value = '';
    if (onFileChange) onFileChange(null);
  };
  useEffect(() => {
    if (onResetFile) {
      setFile(null);
      document.getElementById('proof-of-address-input').value = '';
      if (onFileChange) onFileChange(null);
    }
  }, [onResetFile, onFileChange]);
  return (
    <div className="space-y-2">
      <input
        type="file"
        id="proof-of-address-input"
        name="proof-of-address"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />
      <label
        htmlFor="proof-of-address-input"
        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 font-medium text-sm rounded-full hover:bg-purple-100 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Choose File
      </label>
      {file && (
        <div className="flex items-end gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <svg className="w-5 h-5 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-purple-900 font-medium truncate max-w-[180px]">
            {file.name}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className=" -left-20 ml-auto w-6 h-6 rounded-full bg-black text-white flex items-center justify-center hover:bg-red-600"
          >
            X
          </button>
        </div>
      )}
    </div>
  );
}
// === MAIN COMPONENT ===
const DiliveryAndPayment = ({ onClose, totalPrice }) => {
  // All form states for persistence
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [homeNumber, setHomeNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [districtCommune, setDistrictCommune] = useState('');
  const [country, setCountry] = useState('Cambodia');
  const [purpose, setPurpose] = useState('');
  const [proofOfAddress, setProofOfAddress] = useState(null); // Filename or null
  const [paymentType, setPaymentType] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [amount, setAmount] = useState('');
  const [showCardFields, setShowCardFields] = useState(false);
  const [resetFile] = useState(false);

  const handleProvinceChange = (province) => {
    setSelectedProvince(province);
  };

  // Show QR Code only for ABA or WING
  const showQrCode = paymentType === 'aba' || paymentType === 'wing' || paymentType === 'acelida';

  // Save all form data to localStorage on any change
  useEffect(() => {
    const formDataToSave = {
      name,
      email,
      phone,
      gender,
      homeNumber,
      streetAddress,
      province: selectedProvince,
      districtCommune,
      country,
      purpose,
      proofOfAddress,
      paymentType,
      cardNumber,
      expDate,
      amount,
      showCardFields,
    };
    localStorage.setItem('deliveryPaymentForm', JSON.stringify(formDataToSave));
  }, [name, email, phone, gender, homeNumber, streetAddress, selectedProvince, districtCommune, country, purpose, proofOfAddress, paymentType, cardNumber, expDate, amount, showCardFields]);
  

  // Load all form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('deliveryPaymentForm');
    if (savedData) {
      const data = JSON.parse(savedData);
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setGender(data.gender || '');
      setHomeNumber(data.homeNumber || '');
      setStreetAddress(data.streetAddress || '');
      setSelectedProvince(data.province || '');
      setDistrictCommune(data.districtCommune || '');
      setCountry(data.country || 'Cambodia');
      setPurpose(data.purpose || '');
      setProofOfAddress(data.proofOfAddress || null);
      setPaymentType(data.paymentType || '');
      setCardNumber(data.cardNumber || '');
      setExpDate(data.expDate || '');
      setAmount(data.amount || '');
      setShowCardFields(data.showCardFields || false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      name,
      email,
      gender,
      phone,
      address: homeNumber + ' ' + streetAddress, // Combine if needed
      province: selectedProvince,
      state: districtCommune,
      country,
      purpose,
      paymentType,
      cardNumber: cardNumber.replace(/\s/g, ''),
      expDate,
      proofOfAddress,
      totalPrice,
    };
    console.log('Form Submitted:', formData);
    toast.success("✅ Payment completed successfully!", {
      position: "top-center",
      autoClose: 3000,
    });
    // Optionally clear form after success
    // localStorage.removeItem('deliveryPaymentForm');
    // setResetFile(true);
    // setTimeout(() => setResetFile(false), 100);
  };

  const handleClose = () => {
    // No clear on close - persist data
    onClose();
  };

  return (
    <div className="bg-white py-8 px-4 flex flex-col items-end justify-end font-sans">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
        <div className='w-full flex justify-end'>
          <div className='absolute'>
            <button onClick={handleClose} className='text-black text-xl font-bold hover:text-2xl transition duration-3000 active:text-xl '>X</button>
          </div>
        </div>
        <div className="text-center mb-8 mt-8 ">
          <h2 className="text-3xl font-bold text-gray-900">Delivery And Payment Form</h2>
          <p className="text-sm text-gray-600 mt-1">Required fields are followed by :</p>
        </div>
        
        <form className="space-y-6 mt-5" onSubmit={handleSubmit}>
          {/* === CONTACT INFORMATION === */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Delivery Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>
              <fieldset className="border border-gray-300 rounded-lg p-4">
                <legend className="text-sm font-medium text-gray-700 px-2">Gender </legend>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="male" 
                      checked={gender === 'male'}
                      onChange={(e) => setGender(e.target.value)}
                      required 
                      className="w-4 h-4 text-purple-600" 
                    />
                    <span className="text-gray-700">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="female" 
                      checked={gender === 'female'}
                      onChange={(e) => setGender(e.target.value)}
                      required 
                      className="w-4 h-4 text-purple-600" 
                    />
                    <span className="text-gray-700">Female</span>
                  </label>
                </div>
              </fieldset>
              <hr className="my-5 border-gray-300" />
              {/* === RESIDENTIAL ADDRESS === */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Residential Address</h3>
              <div>
                <label htmlFor="home-number" className="block text-sm font-medium text-gray-700 mb-1">
                  Home Number
                </label>
                <input
                  type="text"
                  id="home-number"
                  name="home-number"
                  placeholder="Enter house number"
                  value={homeNumber}
                  onChange={(e) => setHomeNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="street-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  id="street-address"
                  name="street-address"
                  placeholder="House, Street, Village..."
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                  Province
                </label>
                <ProvinceSearchSelect 
                  onProvinceChange={handleProvinceChange} 
                  value={selectedProvince}
                  onChange={setSelectedProvince}
                />
              </div>
              <div>
                <label htmlFor="district-commune" className="block text-sm font-medium text-gray-700 mb-1">
                  District / Commune
                </label>
                <input
                  type="text"
                  id="district-commune"
                  name="district-commune"
                  placeholder="District, Commune, etc."
                  value={districtCommune}
                  onChange={(e) => setDistrictCommune(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                >
                  <option value="Cambodia">Cambodia</option>
                </select>
              </div>
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose of Form (Optional)
                </label>
                <select
                  id="purpose"
                  name="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                >
                  <option value="">Select purpose</option>
                  <option value="new-address">New Address</option>
                  <option value="address-update">Address Update</option>
                  <option value="delivery-address">Delivery Address</option>
                  <option value="billing-address">Billing Address</option>
                  <option value="permanent-address">Permanent Address</option>
                </select>
              </div>
              {/* === FILE UPLOAD WITH X BUTTON === */}
              <div>
                <label htmlFor="proof-of-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Proof of Address (Optional)
                </label>
                <FileUploadWithRemove 
                  onResetFile={resetFile} 
                  onFileChange={setProofOfAddress} 
                />
              </div>
            </div>
          </div>
          <hr className="border-gray-300" />
          {/* === PAYMENT INFORMATION === */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Information</h3>
            {/* TOTAL PRICE DISPLAY - Positioned above the contact (phone) number */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Price
                  </label>
                  <p className="text-xl font-bold text-purple-700">${totalPrice}</p>
                </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="card_type" className="block text-lg font-medium text-gray-700 mb-1">
                  By QR
                </label>
                <select
                  id="card_type"
                  name="card_type"
                  required
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                >
                  {paymentType === '' && (
                    <option value="" disabled hidden>
                      Select payment type
                    </option>
                  )}
                  <option value="aba">ABA</option>
                  <option value="acelida">ACELIDA</option>
                  <option value="wing">WING</option>
                </select>
              </div>
              {/* QR CODE - ONLY SHOW FOR ABA OR WING */}
              {showQrCode && (
                <div className="flex justify-start my-4">
                  <img
                    src={QrCode}
                    alt="QR Code for Payment"
                    className="w-50 h-60 "
                  />
                </div>
              )}
              <div className='select-none flex flex-row items-center gap-2 cursor-pointer' onClick={() => setShowCardFields(!showCardFields)}>
                <p className="block text-lg font-medium text-gray-700 mb-1">
                  Or By Cart
                </p>
                <button
                  type="button"
                  className={`text-2xl font-medium transition-transform duration-300 ease-in-out ${showCardFields ? 'rotate-90 scale-x-[-1]' : 'rotate-90'}`}
                >
                  {'<'}
                </button>
              </div>
            {/* TOGGLEABLE CARD FIELDS */}
            <div
              className={`space-y-4 border-red-200 px-1 overflow-hidden transition-all duration-300 ease-in-out ${
                showCardFields
                  ? 'max-h-96 opacity-100' // Expanded
                  : 'max-h-0 opacity-0' // Collapsed
              }`}
            >
              <div>
              <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">
                Cart Number
              </label>
              <input
                type="text"
                id="card_number"
                name="card_number"
                required={showCardFields}  // Conditional: only required if toggled on
                pattern="[0-9\s]{15,23}"
                maxLength="23"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\s/g, '');
                  const chunks = rawValue.match(/.{1,4}/g);
                  const formattedValue = chunks ? chunks.join(' ') : '';
                  setCardNumber(formattedValue);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              />
            </div>
                <div>
                    <label htmlFor="exp_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="month"
                      id="exp_date"
                      name="exp_date"
                      required={showCardFields}
                      min="2025-01"  // Min year 2025 (adjust to current year if dynamic: new Date().getFullYear())
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                    />
                  </div>
                
                <div className="relative">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    id="amount"
                    placeholder="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    required={showCardFields}  // Conditional: only required if toggled on
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                  <span className="absolute inset-y-0 left-1 top-6 flex items-center pr-3 pointer-events-none text-black">
                    $
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition shadow-md"
          >
            Finish
          </button>
        </form>
      </div>
    </div>
  );
};
export default DiliveryAndPayment;