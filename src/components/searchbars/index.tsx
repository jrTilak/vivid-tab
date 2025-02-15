import React, { useEffect, useMemo, useState } from "react"

import Searchbar1 from "./1"
import SearchDialog from "./search-dialog"

const Searchbar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Searchbar1 isOpen={isOpen} setIsOpen={setIsOpen} />
      <SearchDialog defaultOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}

export default Searchbar
