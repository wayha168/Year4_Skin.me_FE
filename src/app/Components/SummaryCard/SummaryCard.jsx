import React from "react";

const SummaryCard = ({ title, value, icon: Icon, bgColor = "bg-white" }) => {
  return (
    <div className={`${bgColor} shadow rounded-2xl p-6 flex items-center gap-4`}>
      {Icon && <Icon className="w-10 h-10 text-gray-600" />}
      <div>
        <h2 className="text-gray-500 text-sm">{title}</h2>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
};

export default SummaryCard;
