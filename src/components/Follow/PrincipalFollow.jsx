import React, { useState } from "react";
import Follow from "./Follow";

export default function PrincipalFollow({ personFilter }) {

  return (
    <div className="row w-100 m-auto">
      <Follow personFilter={personFilter} />
    </div>
  );
}
