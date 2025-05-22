import React from 'react';

interface rfpPreviewContentProps {
    logo?: string;
    companyName?: string;
    companyWebsite?: string;
    letterhead?: string;
    phone?: string;
    rfpTitle?: string;
    naicsCode?: string;
    solicitationNumber?: string;
    issuedDate?: string;
    submittedBy?: string;
    sections: { id: number; title: string; content: string }[];
    theme?: string;
}

const rfpPreviewContent: React.FC<rfpPreviewContentProps> = ({
    logo,
    companyName,
    companyWebsite,
    letterhead,
    phone,
    rfpTitle,
    naicsCode,
    solicitationNumber,
    issuedDate,
    submittedBy,
    sections,
    theme,
}) => {
    const getThemeStyles = () => {
        switch (theme) {
            case 'professional':
                return {
                    primary: 'bg-blue-600',
                    primaryHover: 'hover:bg-blue-700',
                    secondary: 'bg-blue-500',
                    accent: 'bg-blue-500',
                    text: 'text-gray-800',
                    header: 'text-blue-700',
                    hover: 'hover:bg-blue-700',
                    border: 'border-blue-200',
                    activeBorder: 'border-blue-500',
                    sectionBg: 'bg-white',
                    sectionHeaderBg: 'bg-blue-50',
                    textColor: 'text-gray-700',
                    link: 'text-blue-600',
                    linkHover: 'hover:text-blue-800',
                    completedBg: 'bg-green-50',
                    completedText: 'text-green-700',
                    completedIcon: 'text-green-600',
                    incompleteIcon: 'text-gray-400',
                    gradient: 'from-blue-600 to-blue-700',
                };
            case 'modern':
                return {
                    primary: 'bg-indigo-600',
                    primaryHover: 'hover:bg-indigo-700',
                    secondary: 'bg-indigo-500',
                    accent: 'bg-purple-500',
                    text: 'text-gray-800',
                    header: 'text-indigo-700',
                    hover: 'hover:bg-indigo-700',
                    border: 'border-indigo-200',
                    activeBorder: 'border-indigo-400',
                    sectionBg: 'bg-white',
                    sectionHeaderBg: 'bg-indigo-50',
                    textColor: 'text-gray-700',
                    link: 'text-indigo-600',
                    linkHover: 'hover:text-indigo-800',
                    completedBg: 'bg-green-50',
                    completedText: 'text-green-700',
                    completedIcon: 'text-green-600',
                    incompleteIcon: 'text-indigo-300',
                    gradient: 'from-indigo-600 to-indigo-700',
                };
              case 'classic':
                return {
                  primary: 'bg-amber-600',
                  primaryHover: 'hover:bg-amber-700',
                  secondary: 'bg-amber-600',
                  accent: 'bg-amber-500',
                  text: 'text-gray-800',
                  header: 'text-amber-700',
                  hover: 'hover:bg-amber-700',
                  border: 'border-amber-200',
                  activeBorder: 'border-amber-500',
                  sectionBg: 'bg-amber-50',
                  sectionHeaderBg: 'bg-amber-100',
                  textColor: 'text-gray-700',
                  link: 'text-amber-600',
                  linkHover: 'hover:text-amber-800',
                  completedBg: 'bg-green-50',
                  completedText: 'text-green-700',
                  completedIcon: 'text-green-600',
                  incompleteIcon: 'text-amber-400',
                  gradient: 'from-amber-600 to-amber-700',
                };
            default:
                return {
                    primary: 'bg-blue-600',
                    primaryHover: 'hover:bg-blue-700',
                    secondary: 'bg-blue-500',
                    accent: 'bg-blue-500',
                    text: 'text-gray-800',
                    header: 'text-blue-700',
                    hover: 'hover:bg-blue-700',
                    border: 'border-blue-200',
                    activeBorder: 'border-blue-500',
                    sectionBg: 'bg-white',
                    sectionHeaderBg: 'bg-blue-50',
                    textColor: 'text-gray-700',
                    link: 'text-blue-600',
                    linkHover: 'hover:text-blue-800',
                    completedBg: 'bg-green-50',
                    completedText: 'text-green-700',
                    completedIcon: 'text-green-600',
                    incompleteIcon: 'text-gray-400',
                    gradient: 'from-blue-600 to-blue-700',
                };
        }
    };

    const styles = getThemeStyles();

    return (
        // <div className="rfp-preview" style={{ backgroundColor: '#ffffff', color: '#000000', width: '8.5in', boxSizing: 'border-box' }}>
        //     {/* Cover Page */}
        //     <div className="section">
        //         <div className="bg-white p-12 shadow-md rounded-xl mb-8" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
        //             <div className="flex flex-col items-center text-center mb-16">
        //                 {logo && <img src={logo} alt="Company Logo" className="max-h-24 object-contain mb-4" crossOrigin="anonymous" />}
        //                 <h1 className="text-3xl font-bold text-gray-800 mb-2">{companyName || 'Company Name'}</h1>
        //                 <a href={companyWebsite} className="text-blue-600 hover:underline mb-4">
        //                     {companyWebsite || 'Company Website'}
        //                 </a>
        //                 <p className="text-gray-600">{letterhead || 'Letterhead'}</p>
        //                 <p className="text-gray-600">Phone: {phone || 'N/A'}</p>
        //             </div>
        //             <div className="mt-24 mb-24">
        //                 <h1 className="text-4xl font-bold text-center mb-8">{rfpTitle || 'Proposal Title'}</h1>
        //                 <div className="border-t border-b border-gray-200 py-6 text-center">
        //                     <p className="font-semibold mb-2">NAICS CODE: {naicsCode || 'N/A'}</p>
        //                     <p className="font-semibold mb-2">SOLICITATION NUMBER: {solicitationNumber || 'N/A'}</p>
        //                     <p>Issued: {issuedDate || 'N/A'}</p>
        //                 </div>
        //             </div>
        //             <div className="mt-32">
        //                 <p className="font-semibold">Submitted By:</p>
        //                 <p>{submittedBy || 'N/A'}</p>
        //                 <p>{letterhead || 'Letterhead'}</p>
        //                 <p>Phone: {phone || 'N/A'}</p>
        //             </div>
        //         </div>
        //     </div>
        //     <div className="section">
        //         {/* Additional Sections */}
        //         {sections.slice(1).map((section) => (
        //             <div key={section.id} className="bg-white p-8 shadow-md mb-8 rounded-xl" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
        //                 <h2 className="text-2xl font-bold mb-4 text-gray-800">{section.title}</h2>
        //                 <div className="whitespace-pre-line">{section.content}</div>
        //             </div>
        //         ))}
        //     </div>
        // </div>
        <div
            className={`rfp-preview p-8 ${styles.sectionBg} ${styles.textColor}`}
            style={{ width: '8.5in', boxSizing: 'border-box' }}
        >
            {/* Cover Page */}
            <div className="section">
                <div
                    className={`p-12 rounded-xl mb-8 shadow-md ${styles.sectionBg} ${styles.border}`}
                >
                    <div className="flex flex-col items-center text-center mb-16">
                        {logo && (
                            <img
                                src={logo}
                                alt="Company Logo"
                                className="max-h-24 object-contain mb-4"
                                crossOrigin="anonymous"
                            />
                        )}
                        <h1 className={`text-3xl font-bold ${styles.header} mb-2`}>
                            {companyName || 'Company Name'}
                        </h1>
                        <a
                            href={companyWebsite}
                            className={`${styles.link} ${styles.linkHover} mb-4`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {companyWebsite || 'Company Website'}
                        </a>
                        <p className={styles.textColor}>{letterhead || 'Letterhead'}</p>
                        <p className={styles.textColor}>Phone: {phone || 'N/A'}</p>
                    </div>
                    <div className="mt-24 mb-24">
                        <h1 className={`text-4xl font-bold text-center mb-8 ${styles.header}`}>
                            {rfpTitle || 'Proposal Title'}
                        </h1>
                        <div className={`border-t border-b py-6 text-center ${styles.border}`}>
                            <p className={`font-semibold mb-2 ${styles.text}`}>
                                NAICS CODE: {naicsCode || 'N/A'}
                            </p>
                            <p className={`font-semibold mb-2 ${styles.text}`}>
                                SOLICITATION NUMBER: {solicitationNumber || 'N/A'}
                            </p>
                            <p className={styles.textColor}>Issued: {issuedDate || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="mt-32">
                        <p className={`font-semibold ${styles.text}`}>
                            Submitted By:
                        </p>
                        <p className={styles.textColor}>{submittedBy || 'N/A'}</p>
                        <p className={styles.textColor}>{letterhead || 'Letterhead'}</p>
                        <p className={styles.textColor}>Phone: {phone || 'N/A'}</p>
                    </div>
                </div>
            </div>
            <div className="section">
                {/* Additional Sections */}
                {sections.slice(1).map((section) => (
                    <div
                        key={section.id}
                        className={`p-8 mb-8 rounded-xl shadow-md ${styles.sectionHeaderBg} ${styles.border}`}
                    >
                        <h2 className={`text-2xl font-bold mb-4 ${styles.header}`}>
                            {section.title}
                        </h2>
                        <div className={`whitespace-pre-line ${styles.textColor}`}>
                            {section.content}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default rfpPreviewContent;