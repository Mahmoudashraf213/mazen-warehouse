const generateMessage = (entity) => ({
    alreadyExist: `${entity} already exist`,
    notExist: `${entity} not found`,
    created: `${entity} created successfully`,
    failToCreate: `Failed to create ${entity}`,
    updated: `${entity} updated successfully`,
    failToUpdate: `Failed to update ${entity}`,
    deleted: `${entity} deleted successfully`,
    failToDelete: `Failed to delete ${entity}`,
    fetchedSuccessfully: `${entity} fetched successfully`,
    failToFetch: `${entity} failed to fetch`
});


export const messages = {
    product : { ...generateMessage('Product') ,
    nameTaken: 'Product name is already taken',
    noPriceMatch: "No products found in this price range",
    noNameMatch: (name) => `No products found with name: ${name}`,
    } ,
    customer :{ ...generateMessage('Customer'),
    phoneTaken: "Phone already in use",
    emailTaken: "Email already in use",
    noNameMatch: (name) => `No customers found with name: ${name}`,
    noPhoneMatch: (phone) => `No customers found with phone: ${phone}`,
    noCompanyMatch: (company) => `No customers found with company: ${company}`,
    }
}