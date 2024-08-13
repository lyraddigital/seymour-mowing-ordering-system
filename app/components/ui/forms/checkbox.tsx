import clsx from "clsx";

interface CheckboxProps {
    isChecked: boolean;
    onCheckChange?: () => void;
}

export default function Checkbox({ isChecked, onCheckChange }: CheckboxProps) {
    const customCheckboxClasses = clsx(
        "flex justify-center text-white font-bold items-center rounded h-6 w-6 border border-green-700 hover:cursor-pointer",
        isChecked ? "bg-green-700" : undefined
    );

    return (
        <div>
            <div className={customCheckboxClasses} onClick={onCheckChange}>
                {isChecked && <span>&#10003;</span>}
            </div>
            <input type="checkbox" checked={isChecked} onChange={onCheckChange} name="bordered-checkbox" className="hidden" />
        </div>
    );
}
