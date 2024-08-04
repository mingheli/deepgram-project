import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons'

const Header = ({ onSort, sortingDirections, currentSortingKey }) => {
    useEffect(() => {
        console.log('Header re-rendered with sortingDirections:', sortingDirections);
    }, [sortingDirections]);
    return (
        <div className="header_row">
            {Object.keys(sortingDirections).map((objectKey) => {
                const direction = (sortingDirections[objectKey] === "ASCENDING" || sortingDirections[objectKey] === "UNSORTED") ? faArrowDown : faArrowUp;
                console.log(direction);
                return <div key={objectKey} className={`header_cell ${currentSortingKey === objectKey ? "highlight" : ""}`} onClick={() => onSort(objectKey)}>{objectKey}
                    <FontAwesomeIcon icon={direction} />
                </div>
            }
            )}
            <div className="header_cell"></div>
            <div className="header_cell"></div>
        </div>
    );
}
export default Header;